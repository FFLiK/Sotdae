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

    static async getOtp(db: D1Database, otpId: string, userId: string): Promise<Otp | null> {
        const result = await db.prepare(
            `SELECT otp.id, otp.title, otp.service_name, otp.otp_key, otp.nonce, otp.created_at, relation.is_manager, relation.visibility, relation.appended_at
            FROM user_otp_relation AS relation
            JOIN otp ON relation.otp_id = otp.id
            WHERE relation.user_id = ? AND relation.otp_id = ?`
        ).bind(userId, otpId).run();
        if (result.results.length === 0) {
            return null;
        }
        const row : any = result.results[0];
        if (!row) {
            return null;
        }
        return {
            id: row.id,
            title: row.title,
            serviceName: row.service_name,
            otpKey: row.otp_key,
            nonce: row.nonce,
            createdAt: row.created_at,
            visibility: row.visibility === 1,
            isManager: row.is_manager === 1,
            appendedAt: row.appended_at
        };
    }

    static async getMemberList(db: D1Database, otpId: string): Promise<{ userId: string, isManager: boolean }[]> {
        const result = await db.prepare(
            `SELECT user_id, is_manager
            FROM user_otp_relation
            WHERE otp_id = ?`
        ).bind(otpId).run();
        return result.results.map((row: any) => ({
            userId: row.user_id,
            isManager: row.is_manager === 1
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

    static async updateTitle(db: D1Database, userId: string, otpId: string, title: string): Promise<boolean> {
        const result = await db.prepare(
            `UPDATE otp
            SET title = ?
            WHERE id = ? AND id IN (
                SELECT otp_id FROM user_otp_relation WHERE user_id = ? AND is_manager = 1
            )`
        ).bind(title, otpId, userId).run();
        return result.success;
    }

    static async updateServiceName(db: D1Database, userId: string, otpId: string, serviceName: string): Promise<boolean> {
        const result = await db.prepare(
            `UPDATE otp
            SET service_name = ?
            WHERE id = ? AND id IN (
                SELECT otp_id FROM user_otp_relation WHERE user_id = ? AND is_manager = 1
            )`
        ).bind(serviceName, otpId, userId).run();
        return result.success;
    }

    static async checkUserOtpRelation(db: D1Database, userId: string, otpId: string): Promise<{ isManager: boolean, isAccessible: boolean } | null> {
        const result = await db.prepare(
            `SELECT is_manager
            FROM user_otp_relation
            WHERE user_id = ? AND otp_id = ?`
        ).bind(userId, otpId).run();
        if (result.results.length === 0) {
            return { isManager: false, isAccessible: false };
        }
        const row : any = result.results[0];
        if (!row) {
            return { isManager: false, isAccessible: false };
        }
        return {
            isManager: row.is_manager === 1,
            isAccessible: true
        };
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
            `INSERT INTO user_otp_relation (user_id, otp_id, is_manager, visibility, appended_at, visibility_changed_at) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, otp_id) DO NOTHING`
        ).bind(userId, otpId, isManager ? 1 : 0, visibility ? 1 : 0, currentTime, currentTime).run();
        return result.meta.changes === 1;
    }
    
    static async removeMembers(db: D1Database, otpId: string, memberIds: string[]): Promise<boolean> {
        const result = await db.prepare(
            `DELETE FROM user_otp_relation WHERE otp_id = ? AND user_id IN (${memberIds.map(() => '?').join(',')})`
        ).bind(otpId, ...memberIds).run();
        return result.success;
    }

    static async updateMemberRole(db: D1Database, otpId: string, memberIds: string[], isManager: boolean): Promise<boolean> {
        const result = await db.prepare(
            `UPDATE user_otp_relation SET is_manager = ? WHERE otp_id = ? AND user_id IN (${memberIds.map(() => '?').join(',')})`
        ).bind(isManager ? 1 : 0, otpId, ...memberIds).run();
        return result.success;
    }
}

export { DB_otp };