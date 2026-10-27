class DB_user {
    static async getUserByEmail(db: D1Database, email: string): Promise<{id: string} | null> {
        const getResult = await db.prepare(
            `SELECT id FROM users WHERE email = ?`
        ).bind(email).first<{id: string}>();
        if (getResult) {
            return { id: getResult.id };
        }
        const userId = crypto.randomUUID();
        const createResult = await db.prepare(
            `INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) RETURNING id`
        ).bind(userId, email, Date.now()).first<{id: string}>();
        if (createResult) {
            return { id: createResult.id };
        }
        return null;
    }
}

export { DB_user };