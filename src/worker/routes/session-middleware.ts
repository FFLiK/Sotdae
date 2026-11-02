import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { DB_session } from "../db/session-repository";
import { DB_otp } from "../db/otp-repository";
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

export const requireManagerSession = createMiddleware<SessionCheckedEnv>(
    async (c, next) => {
        const userId = c.get("userId");
        const otpId = c.req.param("otpid");
        if (!otpId) {
            return c.json({error: "Missing OTP ID in request body."}, 400);
        } else if (typeof otpId !== "string" || otpId.trim().length === 0) {
            return c.json({error: "Invalid OTP ID in request body."}, 400);
        }
        const result = await DB_otp.checkUserOtpRelation(c.env.DB, userId, otpId)
        if (!result) {
            return c.json({error: "User does not have access to this OTP."}, 403);
        } else if (!result.isAccessible) {
            return c.json({error: "User does not have access to this OTP."}, 403);
        } else if (!result.isManager) {
            return c.json({error: "User does not have manager access to this OTP."}, 403);
        }
        await next();
    }
)
