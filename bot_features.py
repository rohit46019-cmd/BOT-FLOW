import sqlite3
import json
import os
from datetime import datetime

DB_PATH = "botflow_python.db"

def init_advanced_features():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Broadcasts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS broadcasts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT,
            title TEXT,
            message TEXT,
            target_group TEXT,
            status TEXT DEFAULT 'Scheduled',
            scheduled_for TEXT,
            created_at TEXT
        )
    ''')
    
    # 2. AI Auto-Reply Settings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_settings (
            account_id TEXT PRIMARY KEY,
            enabled INTEGER DEFAULT 1,
            persona TEXT,
            price_mention TEXT DEFAULT '87rs',
            auto_payment_link TEXT
        )
    ''')
    
    # 3. Analytics logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analytics_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name TEXT,
            metric_value REAL,
            recorded_at TEXT
        )
    ''')
    
    # Seed sample broadcast if empty
    cursor.execute('SELECT COUNT(*) FROM broadcasts')
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        cursor.execute(
            'INSERT INTO broadcasts (account_id, title, message, target_group, status, scheduled_for, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ('acc_main_01', 'SSC Special Batch Launch', 'New SSC CGL 2026 Batch is live now for only 87rs! Join fast.', 'All Study Groups', 'Completed', now, now)
        )

    conn.commit()
    conn.close()
    print("Advanced Python bot features initialized successfully.")

if __name__ == '__main__':
    init_advanced_features()
