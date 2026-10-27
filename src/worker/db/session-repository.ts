import { WORKER_CONFIG_VALUES } from "../config/values";

class DB_session {
    static async create(db: D1Database, session_hash: string, user_id: string, now: number): Promise<string | null> {
        const id = crypto.randomUUID();
        const created_at = now;
        const expires_at = now + WORKER_CONFIG_VALUES.sessionDurationMs;
        const result = await db.prepare(
            `INSERT INTO sessions (id, session_hash, user_id, created_at, expires_at) 
            VALUES (?, ?, ?, ?, ?) 
            ON CONFLICT(session_hash) DO NOTHING 
            RETURNING id`
        ).bind(id, session_hash, user_id, created_at, expires_at)
        .first<{id: string}>();
        return result ? result.id : null;
    }

    static async getUserId(db: D1Database, session_hash: string, now: number): Promise<{userId: string} | null> {
        const cutoff = now - WORKER_CONFIG_VALUES.sessionAbsoluteDurationMs;
        const deleteStatement = "DELETE FROM sessions WHERE session_hash = ? AND (expires_at <= ? OR created_at <= ?);";
        const selectStatement = "SELECT user_id FROM sessions WHERE session_hash = ? AND expires_at > ? AND created_at > ?;";
        const result = await db.batch<{ user_id: string }>([
            db.prepare(deleteStatement).bind(session_hash, now, cutoff),
            db.prepare(selectStatement).bind(session_hash, now, cutoff)
        ]);
        const selectResult = result[1].results[0];
        return selectResult ? {userId: selectResult.user_id} : null;
    }

    static async update(db: D1Database, session_hash: string, now: number): Promise<string | null> {
        const result = await db.prepare(
            `UPDATE sessions SET expires_at = ? 
            WHERE session_hash = ? AND expires_at > ? AND created_at > ? 
            RETURNING id`
        ).bind(now + WORKER_CONFIG_VALUES.sessionDurationMs, session_hash, now, now - WORKER_CONFIG_VALUES.sessionAbsoluteDurationMs)
        .first<{id: string}>();
        return result ? result.id : null;
    }

    static async delete(db: D1Database, session_hash: string): Promise<boolean> {
        const result = await db.prepare(
            `DELETE FROM sessions WHERE session_hash = ? RETURNING id`
        ).bind(session_hash).first<{id: string}>();
        return result ? true : false;
    }
}

export { DB_session };