import { EMAIL_AUTH_POLICY } from "../../shared/config/email-auth-policy";

type SendReservation =
    | { allowed: true; sendCount: number, retryAt: number }
    | {
        allowed: false;
        reason: "cooldown" | "limit" | "unknown";
        retryAt?: number;
    };

class DB_challenge {
    static async create(db: D1Database, id: string, email: string, code_hmac: string, created_at: number, expires_at: number) : Promise<string | null> {
        const result = await db.prepare(
            `INSERT INTO email_auth_challenges
                (id, email, code_hmac, created_at, expires_at, failed_attempt_count)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
                id = excluded.id,
                code_hmac = excluded.code_hmac,
                created_at = excluded.created_at,
                expires_at = excluded.expires_at,
                failed_attempt_count = excluded.failed_attempt_count
            WHERE email_auth_challenges.created_at < excluded.created_at
            RETURNING id`
        ).bind(id, email, code_hmac, created_at, expires_at, 0)
        .first<{id: string}>();
        return result ? result.id : null;
    }

    static async get(db: D1Database, email: string): Promise<{id: string, code_hmac: string, expires_at: number} | null> {
        const result = await db.prepare(
            `SELECT id, code_hmac, expires_at FROM email_auth_challenges WHERE email = ?`
        ).bind(email).first<{id: string, code_hmac: string, expires_at: number}>();
        return result || null;
    }

    static async updateFailedAttempts(db: D1Database, id: string): Promise<number | null> {
        const result = await db.prepare(
            `UPDATE email_auth_challenges SET failed_attempt_count = failed_attempt_count + 1 WHERE id = ? AND failed_attempt_count < ? RETURNING failed_attempt_count`
        ).bind(id, EMAIL_AUTH_POLICY.maxVerificationAttempts).first<{failed_attempt_count: number}>();
        return result ? result.failed_attempt_count : null;
    }

    static async delete(db: D1Database, id: string): Promise<string | null> {
        const result = await db.prepare(
            `DELETE FROM email_auth_challenges WHERE id = ? RETURNING id`
        ).bind(id).first<{id: string}>();

        return result ? result.id : null;
    }

    static async tryReserveEmailSend(db: D1Database, email: string, last_sent_at: number, window_started_at: number): Promise<SendReservation> {
        const result = await db.prepare(
            `INSERT INTO email_auth_rate_limits 
                (email, last_sent_at, window_started_at, send_count)
            VALUES (?, ?, ?, 1)
            ON CONFLICT (email) DO UPDATE SET 
                last_sent_at = excluded.last_sent_at,
                window_started_at = CASE
                    WHEN email_auth_rate_limits.window_started_at <= excluded.last_sent_at - ?
                    THEN excluded.window_started_at
                    ELSE email_auth_rate_limits.window_started_at
                END,
                send_count = CASE
                    WHEN email_auth_rate_limits.window_started_at <= excluded.last_sent_at - ?
                    THEN 1
                    ELSE email_auth_rate_limits.send_count + 1
                END
            WHERE (email_auth_rate_limits.last_sent_at <= excluded.last_sent_at - ?)
            AND (email_auth_rate_limits.window_started_at <= excluded.last_sent_at - ? OR email_auth_rate_limits.send_count < ?)
            RETURNING send_count, window_started_at`
        ).bind(email, last_sent_at, window_started_at, EMAIL_AUTH_POLICY.resend.windowMs, EMAIL_AUTH_POLICY.resend.windowMs, EMAIL_AUTH_POLICY.resend.cooldownMs, EMAIL_AUTH_POLICY.resend.windowMs, EMAIL_AUTH_POLICY.resend.maxPerWindow)
        .first<{send_count: number, window_started_at: number}>();
        if (result) {
            let retryAt = last_sent_at + EMAIL_AUTH_POLICY.resend.cooldownMs;
            if (result.send_count >= EMAIL_AUTH_POLICY.resend.maxPerWindow) {
                retryAt = Math.max(retryAt, result.window_started_at + EMAIL_AUTH_POLICY.resend.windowMs);
            }
            return { allowed: true, sendCount: result.send_count, retryAt: retryAt };
        } else {
            const denialReason = await db.prepare(
                `SELECT last_sent_at, window_started_at, send_count
                FROM email_auth_rate_limits
                WHERE email = ?`
            ).bind(email).first<{last_sent_at: number, window_started_at: number, send_count: number}>();
            if (denialReason) {
                const { last_sent_at, window_started_at, send_count } = denialReason;
                if (send_count >= EMAIL_AUTH_POLICY.resend.maxPerWindow) {
                    return { allowed: false, reason: "limit", retryAt: Math.max(last_sent_at + EMAIL_AUTH_POLICY.resend.cooldownMs, window_started_at + EMAIL_AUTH_POLICY.resend.windowMs) };
                } else {
                    return { allowed: false, reason: "cooldown", retryAt: last_sent_at + EMAIL_AUTH_POLICY.resend.cooldownMs };
                }
            }
            return { allowed: false, reason: "unknown" };
        }
    }
}

export { DB_challenge };