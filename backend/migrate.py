import sqlite3
import sys
import models

def add_column_if_not_exists(cursor, table, column, type):
    try:
        cursor.execute(f'ALTER TABLE {table} ADD COLUMN {column} {type};')
        print(f"✅ Added {column} to {table}.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            # Column already exists, skip
            pass
        else:
            raise e

def migrate():
    try:
        conn = sqlite3.connect('autofix.db')
        cursor = conn.cursor()
        
        # 1. Map SQLAlchemy types to SQLite types
        # Note: This is an approximation for simple migration purposes.
        type_map = {
            "VARCHAR": "TEXT",
            "String": "TEXT",
            "Integer": "INTEGER",
            "INTEGER": "INTEGER",
            "FLOAT": "FLOAT",
            "Float": "FLOAT",
            "Boolean": "BOOLEAN DEFAULT 0",
            "BOOLEAN": "BOOLEAN DEFAULT 0",
            "DateTime": "DATETIME",
            "DATETIME": "DATETIME",
        }

        # 2. Automatically sync all columns from models.py
        for model in [models.Complaint, models.Staff]:
            table_name = model.__tablename__
            cursor.execute(f"PRAGMA table_info({table_name})")
            db_cols = {row[1] for row in cursor.fetchall()}
            
            for column in model.__table__.columns:
                if column.name not in db_cols:
                    col_type = type_map.get(str(column.type), "TEXT")
                    add_column_if_not_exists(cursor, table_name, column.name, col_type)

        conn.commit()
        conn.close()
        print("\n🚀 Migration complete. Database is in sync with models.py.")
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()
