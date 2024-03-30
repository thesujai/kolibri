import sqlite3
from datetime import datetime

DB_NAME = "error_report.sqlite"


def create_connection():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(
        """CREATE TABLE IF NOT EXISTS error_report (
                        id INTEGER PRIMARY KEY,
                        error_from TEXT DEFAULT "Backend",
                        error_message TEXT,
                        traceback TEXT,
                        first_occurred TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_occurred TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        sent BOOLEAN DEFAULT 0,
                        no_of_errors INTEGER DEFAULT 1
                    )"""
    )
    conn.commit()
    return conn, cursor


def insert_or_update_error(error_from, error_message, traceback):
    conn, cursor = create_connection()
    cursor.execute(
        "SELECT id, no_of_errors FROM error_report WHERE traceback=? AND error_message=?",
        (traceback, error_message),
    )
    existing_error = cursor.fetchone()
    if existing_error:
        error_id, no_of_errors = existing_error
        cursor.execute(
            "UPDATE error_report SET last_occurred=?, no_of_errors=? WHERE id=?",
            (datetime.now(), no_of_errors + 1, error_id),
        )
    else:
        cursor.execute(
            "INSERT INTO error_report (error_from, error_message, traceback, first_occurred, last_occurred) VALUES (?, ?, ?, ?, ?)",
            (error_from, error_message, traceback, datetime.now(), datetime.now()),
        )
    conn.commit()
    conn.close()


def delete_error(error_id):
    conn, cursor = create_connection()
    cursor.execute("DELETE FROM error_report WHERE id=?", (error_id,))
    conn.commit()
    conn.close()


def get_unsent_errors():
    conn, cursor = create_connection()
    cursor.execute("SELECT * FROM error_report WHERE sent=0")
    unsent_errors = cursor.fetchall()
    conn.close()
    return unsent_errors
