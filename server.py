#!/usr/bin/env python3
"""Asteorun's static server and shared, atomic JSON top-ten board. Python standard library only."""
import argparse
import json
import os
from pathlib import Path
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
from uuid import uuid4
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent
DIFFICULTIES = {'veryeasy', 'easy', 'normal', 'hard', 'hardcore'}

class ScoreStore:
    def __init__(self, path):
        self.path = Path(path)
        self.lock = threading.Lock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text('[]\n', encoding='utf-8')

    def _read(self):
        value = json.loads(self.path.read_text(encoding='utf-8'))
        if not isinstance(value, list):
            raise ValueError('Score file must contain a list')
        return value

    def list(self):
        with self.lock:
            return self._read()[:10]

    def add(self, value):
        if not isinstance(value, dict):
            raise ValueError('Expected a score object')
        name = value.get('name', '')
        if not isinstance(name, str) or not 1 <= len(name.strip()) <= 16 or any(not c.isprintable() for c in name):
            raise ValueError('Choose a printable name of 1–16 characters')
        score, level, difficulty = value.get('score'), value.get('level'), value.get('difficulty')
        if type(score) is not int or not 0 <= score <= 100_000_000:
            raise ValueError('Invalid score')
        if type(level) is not int or not 1 <= level <= 8 or not isinstance(difficulty,str) or difficulty not in DIFFICULTIES:
            raise ValueError('Invalid level or difficulty')
        won = value.get('won', False)
        if type(won) is not bool or (won and level != 8):
            raise ValueError('Invalid completion flag')
        # A stable client submission ID makes a lost-response retry safe.
        submission = value.get('submission', '')
        if not isinstance(submission, str) or not 1 <= len(submission) <= 80 or any(not c.isalnum() and c != '-' for c in submission):
            raise ValueError('Invalid submission ID')
        with self.lock:
            entries = self._read()
            if any(e.get('submission') == submission for e in entries):
                return entries[:10]
            entries.append(dict(id=str(uuid4()), submission=submission, name=name.strip(), score=score,
                                level=level, difficulty=difficulty, won=won,
                                date=datetime.now(timezone.utc).isoformat()))
            entries.sort(key=lambda e: (-e['score'], -e['level'], not e['won'], e['date']))
            entries = entries[:10]
            temporary = None
            try:
                with tempfile.NamedTemporaryFile('w', dir=self.path.parent, encoding='utf-8', delete=False) as handle:
                    temporary = handle.name
                    json.dump(entries, handle, ensure_ascii=False, indent=2)
                    handle.write('\n')
                    handle.flush()
                    os.fsync(handle.fileno())
                os.replace(temporary, self.path)
            finally:
                if temporary and os.path.exists(temporary):
                    os.unlink(temporary)
            return entries

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def reply(self, status, value):
        data = json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == '/api/scores':
            try:
                self.reply(200, {'scores': self.server.scores.list()})
            except (OSError, ValueError):
                self.reply(503, {'error': 'The score archive is temporarily unavailable.'})
            return
        parts = Path(path).parts
        if any(part.startswith('.') for part in parts) or path.startswith('/data/'):
            self.send_error(404)
            return
        if path.endswith('/') and path != '/':
            self.send_error(404)
            return
        super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != '/api/scores':
            self.reply(404, {'error': 'Not found'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 4096:
                raise ValueError('Invalid request size')
            value = json.loads(self.rfile.read(length).decode('utf-8'))
            self.reply(200, {'scores': self.server.scores.add(value)})
        except (ValueError, UnicodeError) as error:
            self.reply(400, {'error': str(error)})
        except OSError:
            self.reply(503, {'error': 'Could not save the score. Please try again.'})

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        # Revalidate HTML and scripts so a patch cannot mix old rules with a new HUD.
        if urlsplit(self.path).path != '/api/scores':
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

def make_server(host='0.0.0.0', port=8000, score_file=None):
    server = ThreadingHTTPServer((host, port), Handler)
    server.scores = ScoreStore(score_file or ROOT / 'data' / 'highscores.json')
    return server

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='0.0.0.0')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--scores', type=Path, default=ROOT / 'data' / 'highscores.json')
    args = parser.parse_args()
    with make_server(args.host, args.port, args.scores) as server:
        print(f'Asteorun ready at http://localhost:{server.server_port} · scores: {args.scores}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
