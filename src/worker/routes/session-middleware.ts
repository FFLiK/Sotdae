import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { DB_session } from "../db/session-repository";
import { createSHA256Hash } from "../auth/hashing";

export type SessionCheckedEnv = {
    Bindings: Env;
    Variables: {
        userId: string;
    }
}

export const requireSession = createMiddleware<SessionCheckedEnv>(
    async (c, next) => {
        const sessionToken = getCookie(c, "session_token");
        if (!sessionToken) {
            return c.json({error: "Missing session token cookie."}, 401);
        }
        const hashedToken = await createSHA256Hash(sessionToken);
        const userId = await DB_session.getUserId(c.env.DB, hashedToken, Date.now());
        if (!userId) {
            return c.json({error: "Invalid or expired session token."}, 401);
        }
        const updateResult = await DB_session.update(c.env.DB, hashedToken, Date.now());
        if (!updateResult) {
            return c.json({error: "Failed to update session expiration."}, 401);
        }
        c.set("userId", userId.userId);
        await next();
    }
)