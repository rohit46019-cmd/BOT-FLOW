import sqlite3
import json
import os
from datetime import datetime

DB_PATH = "botflow_python.db"

def init_bot_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            avatar_style TEXT DEFAULT 'bottts',
            avatar_color TEXT DEFAULT 'indigo',
            is_main INTEGER DEFAULT 0,
            session_string TEXT,
            created_at TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rules (
            id TEXT PRIMARY KEY,
            account_id TEXT,
            keyword TEXT,
            action TEXT,
            reply_text TEXT,
            enabled INTEGER DEFAULT 1
        )
    ''')
    # Seed default main account if empty
    cursor.execute('SELECT COUNT(*) FROM accounts')
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        cursor.execute(
            'INSERT INTO accounts (id, name, phone, avatar_style, avatar_color, is_main, session_string, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ('acc_main_01', 'Main Telegram Account', '+919876543210', 'bottts', 'indigo', 1, 'sample_session_string_123', now)
        )
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_bot_db()
    print("Python Bot Manager database initialized successfully.")
