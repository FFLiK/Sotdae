import { Hono } from "hono";
import { requireManagerSession, requireSession } from "./session-middleware";
import { SessionCheckedEnv } from "./session-middleware";
import { DB_otp } from "../db/otp-repository";
import { decryptAESGCM } from "../auth/aes-gcm";
import { generateOtpCode } from "../auth/hotp";
import { DB_user } from "../db/user-repository";
const router = new Hono<SessionCheckedEnv>();

router.use("*", requireSession);

type OtpValue = {
    id: string;
    title: string;
    serviceName: string;
    otpCode: string;
    visibility: boolean;
    isManager: boolean;
    appendedAt: number;
}

function getTimeInterval(): number {
    const currentTime = Date.now();
    return Math.floor(currentTime / 30000);
}

async function generateOTPCode (otpKey : string, nonce: string, timeInterval: number, key: string): Promise<string> {
    const decryptedKey = await decryptAESGCM(otpKey, nonce, key);
    const otpCode = await generateOtpCode(decryptedKey, timeInterval);
    return otpCode;
}

async function getUserOtp(db: D1Database, key: string, userId: string, timeInterval: number): Promise<OtpValue[]> {
    const otps = await DB_otp.getOtpList(db, userId);
    console.log(`Retrieved ${otps.length} OTPs for user ${userId}.`);
    let otpValues: OtpValue[] = [];
    for (const otp of otps) {
        const otpCode = await generateOTPCode(otp.otpKey, otp.nonce, timeInterval, key);
        otpValues.push({
            id: otp.id,
            title: otp.title,
            serviceName: otp.serviceName,
            otpCode: otpCode,
            visibility: otp.visibility,
            isManager: otp.isManager,
            appendedAt: otp.appendedAt
        });
    }
    otpValues.sort((a, b) => a.appendedAt - b.appendedAt);
    return otpValues;
}

router.get(
    "/",
    async (c) => {
        const timeInterval = getTimeInterval();
        let OtpList = await getUserOtp(c.env.DB, c.env.OTP_ENCRYPTION_KEY, c.get("userId"), timeInterval);
        return c.json({
            message: "Current OTP codes retrieved successfully",
            otpList: OtpList,
            timeInterval: timeInterval
        }, 200);
    }
)

router.get(
    "/next",
    async (c) => {
        const timeInterval = getTimeInterval() + 1;
        let OtpList = await getUserOtp(c.env.DB, c.env.OTP_ENCRYPTION_KEY, c.get("userId"), timeInterval);
        return c.json({
            message: "Next OTP codes generated successfully",
            otpList: OtpList,
            timeInterval: timeInterval
        }, 200);
    }
);

router.get(
    "/:otpid",
    async (c) => {
        const otpId = c.req.param("otpid");
        const timeInterval = getTimeInterval();
        const otp = await DB_otp.getOtp(c.env.DB, otpId, c.get("userId"));
        if (!otp) {
            return c.json({ error: "OTP not found" }, 404);
        }
        const otpCode = await generateOTPCode(otp.otpKey, otp.nonce, timeInterval, c.env.OTP_ENCRYPTION_KEY);
        return c.json({
            message: "OTP code retrieved successfully",
            otp: {
                id: otp.id,
                title: otp.title,
                serviceName: otp.serviceName,
                otpCode: otpCode,
                visibility: otp.visibility,
                isManager: otp.isManager,
                appendedAt: otp.appendedAt
            },
            timeInterval: timeInterval
        }, 200);
    }
);

router.get(
    "/:otpid/next",
    async (c) => {
        const otpId = c.req.param("otpid");
        const timeInterval = getTimeInterval() + 1;
        const otp = await DB_otp.getOtp(c.env.DB, otpId, c.get("userId"));
        if (!otp) {
            return c.json({ error: "OTP not found" }, 404);
        }
        const otpCode = await generateOTPCode(otp.otpKey, otp.nonce, timeInterval, c.env.OTP_ENCRYPTION_KEY);
        return c.json({
            message: "Next OTP code generated successfully",
            otp: {
                id: otp.id,
                title: otp.title,
                serviceName: otp.serviceName,
                otpCode: otpCode,
                visibility: otp.visibility,
                isManager: otp.isManager,
                appendedAt: otp.appendedAt
            },
            timeInterval: timeInterval
        }, 200);
    }
);

router.get(
    "/code/:otpid",
    async (c) => {
        const otpId = c.req.param("otpid");
        const timeInterval = getTimeInterval();
        const otp = await DB_otp.getOtp(c.env.DB, otpId, c.get("userId"));
        if (!otp) {
            return c.json({ error: "OTP not found" }, 404);
        }
        const otpCode = await generateOTPCode(otp.otpKey, otp.nonce, timeInterval, c.env.OTP_ENCRYPTION_KEY);
        return c.json({
            message: "OTP code retrieved successfully",
            otpCode: otpCode,
            timeInterval: timeInterval
        }, 200);
    }
)

router.get(
    "/code/:otpid/next",
    async (c) => {
        const otpId = c.req.param("otpid");
        const timeInterval = getTimeInterval() + 1;
        const otp = await DB_otp.getOtp(c.env.DB, otpId, c.get("userId"));
        if (!otp) {
            return c.json({ error: "OTP not found" }, 404);
        }
        const otpCode = await generateOTPCode(otp.otpKey, otp.nonce, timeInterval, c.env.OTP_ENCRYPTION_KEY);
        return c.json({
            message: "Next OTP code generated successfully",
            otpCode: otpCode,
            timeInterval: timeInterval
        }, 200);
    }
)

router.get(
    "/:otpid/members",
    requireManagerSession,
    async (c) => {
        const otpId = c.req.param("otpid");
        const members = await DB_otp.getMemberList(c.env.DB, otpId);
        if (!members) {
            return c.json({ error: "Member list not found" }, 404);
        }
        const detailedMemberList = await Promise.all(members.map(async (user) => {
            const email = await DB_user.getEmail(c.env.DB, user.userId);
            if (!email) {
                return c.json({ error: "Some users do not have email addresses associated with their accounts." }, 404);
            }
            return {
                userId: user.userId,
                userEmail: email,
                isManager: user.isManager
            };
        }));
        return c.json({
            message: "User list retrieved successfully",
            members: detailedMemberList
        }, 200);
    }
)

export default router;