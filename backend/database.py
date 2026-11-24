
import os
import sqlite3
from pathlib import Path

# Use persistent storage when DATA_DIR is configured.
# Otherwise, keep the existing local database location.
DATA_DIR = Path(
    os.getenv("DATA_DIR", Path(__file__).resolve().parent)
)

DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = DATA_DIR / "documind.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT,
                google_id TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                total_chunks INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE
            )
        """)

        connection.commit()

    finally:
        connection.close()


def save_document(
    document_id,
    user_id,
    filename,
    file_size,
    total_chunks
):
    connection = get_connection()

    try:
        connection.execute(
            """
            INSERT INTO documents (
                document_id,
                user_id,
                filename,
                file_size,
                total_chunks
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                document_id,
                user_id,
                filename,
                file_size,
                total_chunks
            )
        )

        connection.commit()

    finally:
        connection.close()


def get_user_document(document_id, user_id):
    connection = get_connection()

    try:
        document = connection.execute(
            """
            SELECT *
            FROM documents
            WHERE document_id = ? AND user_id = ?
            """,
            (document_id, user_id)
        ).fetchone()

        return dict(document) if document else None

    finally:
        connection.close()


def get_user_documents(user_id):
    connection = get_connection()

    try:
        documents = connection.execute(
            """
            SELECT *
            FROM documents
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,)
        ).fetchall()

        return [dict(document) for document in documents]

    finally:
        connection.close()


def delete_document_record(document_id, user_id):
    connection = get_connection()

    try:
        connection.execute(
            """
            DELETE FROM documents
            WHERE document_id = ? AND user_id = ?
            """,
            (document_id, user_id)
        )

        connection.commit()

    finally:
        connection.close()
