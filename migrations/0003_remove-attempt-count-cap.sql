-- Migration number: 0003 	 2026-09-29T07:37:27.928Z
CREATE TABLE email_auth_challenges_new (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    code_hmac TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    failed_attempt_count INTEGER NOT NULL DEFAULT 0
        CHECK (failed_attempt_count >= 0),
    CHECK (expires_at > created_at)
);

INSERT INTO email_auth_challenges_new
    (id, email, code_hmac, created_at, expires_at, failed_attempt_count)
SELECT id, email, code_hmac, created_at, expires_at, failed_attempt_count
FROM email_auth_challenges;

DROP TABLE email_auth_challenges;
ALTER TABLE email_auth_challenges_new RENAME TO email_auth_challenges;