-- Migration number: 0005 	 2026-10-28T07:07:38.562Z
CREATE TABLE otp (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    service_name TEXT NOT NULL,
    otp_key TEXT NOT NULL UNIQUE,
    nonce TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
);

CREATE TABLE user_otp_relation (
    user_id TEXT NOT NULL,
    otp_id TEXT NOT NULL,
    is_manager BOOLEAN NOT NULL DEFAULT FALSE,
    visibility BOOLEAN NOT NULL DEFAULT TRUE,
    appended_at INTEGER NOT NULL,
    visibility_changed_at INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, otp_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (otp_id) REFERENCES otp (id) ON DELETE CASCADE,
    CHECK (appended_at > 0),
    CHECK (is_manager IN (0, 1)),
    CHECK (visibility IN (0, 1))
);