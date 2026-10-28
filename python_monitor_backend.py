import http.server
import socketserver
import json
import urllib.request
import urllib.error
import threading
import time
import sqlite3
import os
from datetime import datetime
from urllib.parse import urlparse, parse_qs

PORT = 5005
DB_PATH = "python_monitor.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS monitored_urls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'Unknown',
            response_time REAL DEFAULT 0,
            last_checked TEXT,
            error_message TEXT,
            created_at TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS check_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url_id INTEGER,
            status TEXT,
            response_time REAL,
            checked_at TEXT,
            error_message TEXT
        )
    ''')
    cursor.execute('SELECT COUNT(*) FROM monitored_urls')
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        cursor.execute(
            'INSERT INTO monitored_urls (url, name, status, created_at) VALUES (?, ?, ?, ?)',
            ('https://aistudio.google.com', 'Google AI Studio (24/7 Monitored)', 'Checking', now)
        )
    conn.commit()
    conn.close()

init_db()

def check_url(url_id, url):
    start_time = time.time()
    status = "Up"
    error_msg = ""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PythonUptimeMonitor/1.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            code = response.getcode()
            if code < 200 or code >= 400:
                status = "Down"
                error_msg = f"HTTP Status Code: {code}"
    except urllib.error.HTTPError as e:
        status = "Down"
        error_msg = f"HTTP Error: {e.code} {e.reason}"
    except urllib.error.URLError as e:
        status = "Down"
        error_msg = f"URL Error: {e.reason}"
    except Exception as e:
        status = "Down"
        error_msg = str(e)

    elapsed = round((time.time() - start_time) * 1000, 2)
    checked_at = datetime.now().isoformat()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE monitored_urls SET status = ?, response_time = ?, last_checked = ?, error_message = ? WHERE id = ?',
        (status, elapsed, checked_at, error_msg, url_id)
    )
    cursor.execute(
        'INSERT INTO check_logs (url_id, status, response_time, checked_at, error_message) VALUES (?, ?, ?, ?, ?)',
        (url_id, status, elapsed, checked_at, error_msg)
    )
    conn.commit()
    conn.close()

def background_monitor_worker():
    print("Python Background Uptime Monitor Worker Started (interval: 300s / 5 min).")
    while True:
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('SELECT id, url FROM monitored_urls')
            rows = cursor.fetchall()
            conn.close()

            for row in rows:
                url_id, url = row
                try:
                    check_url(url_id, url)
                except Exception as e:
                    print(f"Error checking {url}: {e}")
        except Exception as e:
            print(f"Monitor worker error: {e}")
        
        time.sleep(300)

monitor_thread = threading.Thread(target=background_monitor_worker, daemon=True)
monitor_thread.start()

class UptimeMonitorHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path == '/api/python/monitors':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('SELECT id, url, name, status, response_time, last_checked, error_message, created_at FROM monitored_urls')
            rows = cursor.fetchall()
            conn.close()
            
            monitors = []
            for r in rows:
                monitors.append({
                    "id": r[0],
                    "url": r[1],
                    "name": r[2],
                    "status": r[3],
                    "responseTime": r[4],
                    "lastChecked": r[5],
                    "errorMessage": r[6],
                    "createdAt": r[7]
                })
            self.wfile.write(json.dumps({"success": True, "monitors": monitors}).encode('utf-8'))
            return

        elif path == '/api/python/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response_data = {
                "status": "online",
                "engine": "Python Uptime Monitor",
                "timestamp": datetime.now().isoformat(),
                "backgroundWorker": "active"
            }
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return

        super().do_GET()

    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path == '/api/python/monitors':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode('utf-8'))
                url = data.get('url')
                name = data.get('name', url)
                if not url:
                    raise ValueError("URL is required")

                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                now = datetime.now().isoformat()
                cursor.execute(
                    'INSERT INTO monitored_urls (url, name, status, created_at) VALUES (?, ?, ?, ?)',
                    (url, name, 'Checking', now)
                )
                new_id = cursor.lastrowid
                conn.commit()
                conn.close()

                threading.Thread(target=check_url, args=(new_id, url), daemon=True).start()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "id": new_id, "message": "Monitor added successfully"}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
            return

        elif path.startswith('/api/python/monitors/') and path.endswith('/check'):
            try:
                parts = path.split('/')
                url_id = int(parts[4])
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute('SELECT url FROM monitored_urls WHERE id = ?', (url_id,))
                row = cursor.fetchone()
                conn.close()

                if row:
                    url = row[0]
                    check_url(url_id, url)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True, "message": "Check completed"}).encode('utf-8'))
                else:
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": "Monitor not found"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        if path.startswith('/api/python/monitors/'):
            try:
                parts = path.split('/')
                url_id = int(parts[4])
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute('DELETE FROM monitored_urls WHERE id = ?', (url_id,))
                cursor.execute('DELETE FROM check_logs WHERE url_id = ?', (url_id,))
                conn.commit()
                conn.close()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Monitor deleted"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
            return
        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    print(f"Starting Python Uptime Monitor Server on port {PORT}...")
    with socketserver.TCPServer(("", PORT), UptimeMonitorHandler) as httpd:
        print(f"Python Uptime Monitor serving at port {PORT}")
        httpd.serve_forever()
