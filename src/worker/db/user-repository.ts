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

    static async getEmail(db: D1Database, userId: string): Promise<string | null> {
        const getResult = await db.prepare(
            `SELECT email FROM users WHERE id = ?`
        ).bind(userId).first<{email: string}>();
        return getResult ? getResult.email : null;
    }
}

export { DB_user };