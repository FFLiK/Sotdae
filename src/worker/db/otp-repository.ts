export type Otp = {
    id: string;
    title: string;
    serviceName: string;
    otpKey: string;
    nonce: string;
    createdAt: number;
    visibility: boolean;
    isManager: boolean;
    appendedAt: number;
}

class DB_otp {
    static async getOtpList(db: D1Database, userId: string): Promise<Otp[]> {
        const result = await db.prepare(
            `SELECT otp.id, otp.title, otp.service_name, otp.otp_key, otp.nonce, otp.created_at, relation.is_manager, relation.visibility, relation.appended_at
            FROM user_otp_relation AS relation
            JOIN otp ON relation.otp_id = otp.id
            WHERE relation.user_id = ?`
        ).bind(userId).run();
        return result.results.map((row: any) => ({
            id: row.id,
            title: row.title,
            serviceName: row.service_name,
            otpKey: row.otp_key,
            nonce: row.nonce,
            createdAt: row.created_at,
            visibility: row.visibility === 1,
            isManager: row.is_manager === 1,
            appendedAt: row.appended_at
        }));
    }

    static async updateVisibility(db: D1Database, userId: string, otpId: string, visibility: boolean, visibilityChangedAt: number): Promise<boolean> {
        const result = await db.prepare(
            `UPDATE user_otp_relation
            SET visibility = ?, visibility_changed_at = ?
            WHERE user_id = ? AND otp_id = ? AND visibility_changed_at < ?`
        ).bind(visibility ? 1 : 0, visibilityChangedAt, userId, otpId, visibilityChangedAt).run();
        return result.success;
    }

    static async createOtp(db: D1Database, title: string, serviceName: string, otpKey: string, nonce: string, userId: string, visibility: boolean): Promise<string | null> {
        const id = crypto.randomUUID();
        const createdAt = Date.now();
        const createOtpStatement = db.prepare(
            `INSERT INTO otp (id, title, service_name, otp_key, nonce, created_at) VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(id, title, serviceName, otpKey, nonce, createdAt);
        const createRelationStatement = db.prepare(
            `INSERT INTO user_otp_relation (user_id, otp_id, is_manager, visibility, appended_at, visibility_changed_at) VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(userId, id, 1, visibility ? 1 : 0, createdAt, createdAt);
        const result = await db.batch([createOtpStatement, createRelationStatement]).then((results) => results[0]);
        return result.success ? id : null;
    }

    static async createUserOtpRelation(db: D1Database, userId: string, otpId: string, isManager: boolean, visibility: boolean): Promise<boolean> {
        const currentTime = Date.now();
        const result = await db.prepare(
            `INSERT INTO user_otp_relation (user_id, otp_id, is_manager, visibility, appended_at, visibility_changed_at) VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(userId, otpId, isManager ? 1 : 0, visibility ? 1 : 0, currentTime, currentTime).run();
        return result.success;
    }
}
export { DB_otp };