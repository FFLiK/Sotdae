-- Migration number: 0004 	 2026-10-26T10:45:53.990Z
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    session_hash TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CHECK (expires_at > created_at)
);