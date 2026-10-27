-- Migration number: 0001 	 2026-09-24T14:42:29.561Z
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
);

CREATE TABLE email_auth_challenges (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    code_hmac TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    failed_attempt_count INTEGER NOT NULL DEFAULT 0
        CHECK (failed_attempt_count BETWEEN 0 AND 5),
    CHECK (expires_at > created_at)
);