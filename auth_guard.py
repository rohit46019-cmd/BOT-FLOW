"""
Python Authentication & Account Isolation Guard (auth_guard.py)
Provides secure session token verification, PIN validation, and multi-tenant account isolation.
"""
import sys
import json
import sqlite3
import hashlib
import os
import time

DB_PATH = "botflow_python.db"

def init_security_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            token TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            device_id TEXT,
            created_at REAL NOT NULL,
            expires_at REAL NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS account_locks (
            account_id TEXT PRIMARY KEY,
            pin_hash TEXT NOT NULL,
            is_locked INTEGER DEFAULT 1,
            updated_at REAL NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_security_db()

def hash_pin(pin: str) -> str:
    salt = "botflow_secure_salt_2026"
    return hashlib.sha256((salt + str(pin)).encode('utf-8')).hexdigest()

def set_account_pin(account_id: str, pin: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    pin_hash = hash_pin(pin) if pin else ""
    now = time.time()
    cursor.execute('''
        INSERT INTO account_locks (account_id, pin_hash, is_locked, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(account_id) DO UPDATE SET
            pin_hash = excluded.pin_hash,
            is_locked = excluded.is_locked,
            updated_at = excluded.updated_at
    ''', (account_id, pin_hash, 1 if pin else 0, now))
    conn.commit()
    conn.close()
    return {"success": True, "account_id": account_id, "locked": bool(pin)}

def verify_account_pin(account_id: str, pin: str) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT pin_hash FROM account_locks WHERE account_id = ?', (account_id,))
    row = cursor.fetchone()
    conn.close()
    if not row or not row[0]:
        return True  # If no PIN configured, account is not restricted
    return row[0] == hash_pin(pin)

def create_session_token(account_id: str, device_id: str = "default_device") -> str:
    raw = f"{account_id}:{device_id}:{time.time()}:botflow_token"
    token = hashlib.sha256(raw.encode('utf-8')).hexdigest()
    now = time.time()
    expires_at = now + (30 * 24 * 3600)  # 30 days session
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO user_sessions (token, account_id, device_id, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (token, account_id, device_id, now, expires_at))
    conn.commit()
    conn.close()
    return token

def validate_session_token(token: str, account_id: str) -> bool:
    if not token:
        return False
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT account_id, expires_at FROM user_sessions WHERE token = ?
    ''', (token,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return False
    sess_account, expires_at = row
    if time.time() > expires_at:
        return False
    # If session is for master/default, allowed to access
    if sess_account == 'default':
        return True
    return sess_account == account_id

if __name__ == '__main__':
    # CLI interface for Python auth engine
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == 'verify' and len(sys.argv) >= 4:
            acc = sys.argv[2]
            p = sys.argv[3]
            res = verify_account_pin(acc, p)
            print(json.dumps({"valid": res}))
        elif cmd == 'set' and len(sys.argv) >= 4:
            acc = sys.argv[2]
            p = sys.argv[3]
            res = set_account_pin(acc, p)
            print(json.dumps(res))
        elif cmd == 'token' and len(sys.argv) >= 3:
            acc = sys.argv[2]
            tok = create_session_token(acc)
            print(json.dumps({"token": tok}))
        else:
            print(json.dumps({"status": "Python Auth Guard active", "db": DB_PATH}))
    else:
        print(json.dumps({"status": "Python Auth Guard initialized"}))
