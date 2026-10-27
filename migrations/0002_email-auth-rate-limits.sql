-- Migration number: 0002 	 2026-09-25T15:29:30.897Z
CREATE TABLE email_auth_rate_limits (
    email TEXT PRIMARY KEY,
    last_sent_at INTEGER NOT NULL,
    window_started_at INTEGER NOT NULL,
    send_count INTEGER NOT NULL DEFAULT 0
        CHECK (send_count >= 0)
);