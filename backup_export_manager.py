import json
import sqlite3
import os
from datetime import datetime

BACKUP_DB_PATH = "botflow_python.db"

def export_configurations():
    if not os.path.exists(BACKUP_DB_PATH):
        return {"error": "Database not found"}
    
    conn = sqlite3.connect(BACKUP_DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM accounts")
    accounts = [dict(zip([column[0] for column in cursor.description], row)) for row in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM rules")
    rules = [dict(zip([column[0] for column in cursor.description], row)) for row in cursor.fetchall()]
    
    conn.close()
    
    backup_data = {
        "version": "1.0.0",
        "exported_at": datetime.now().isoformat(),
        "accounts": accounts,
        "rules": rules
    }
    
    backup_filename = f"botflow_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(backup_filename, "w") as f:
        json.dump(backup_data, f, indent=2)
        
    print(f"Configurations exported successfully to {backup_filename} in Python.")
    return backup_filename

if __name__ == "__main__":
    export_configurations()
