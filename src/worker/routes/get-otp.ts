import { Hono } from "hono";
import { requireSession } from "./session-middleware";
import { SessionCheckedEnv } from "./session-middleware";
import { validator } from "hono/validator";
import { DB_otp } from "../db/otp-repository";
import { decryptAESGCM } from "../auth/aes-gcm";
import { generateOtpCode } from "../auth/hotp";
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

async function getUserOtp(db: D1Database, key: string, userId: string, timeInterval: number): Promise<OtpValue[]> {
    const otps = await DB_otp.getOtpList(db, userId);
    console.log(`Retrieved ${otps.length} OTPs for user ${userId}.`);
    const generateOTPCode = async (otpKey : string, nonce: string): Promise<string> => {
        const decryptedKey = await decryptAESGCM(otpKey, nonce, key);
        const otpCode = await generateOtpCode(decryptedKey, timeInterval);
        return otpCode;
    }
    let otpValues: OtpValue[] = [];
    for (const otp of otps) {
        const otpCode = await generateOTPCode(otp.otpKey, otp.nonce);
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
        const currentTime = Date.now();
        const timeInterval = Math.floor(currentTime / 30000);
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
        const currentTime = Date.now();
        const timeInterval = Math.floor(currentTime / 30000) + 1;
        let OtpList = await getUserOtp(c.env.DB, c.env.OTP_ENCRYPTION_KEY, c.get("userId"), timeInterval);
        return c.json({
            message: "Next OTP codes generated successfully",
            otpList: OtpList,
            timeInterval: timeInterval
        }, 200);
    }
);

router.put(
    "/:id/visibility",
    validator("json", (value, c) => {
        const visibility = value["visibility"];
        const timestamp = value["timestamp"];
        if (typeof visibility !== "boolean") {
            return c.json({error: "Invalid visibility value"}, 400);
        }
        if (typeof timestamp !== "number") {
            return c.json({error: "Invalid timestamp value"}, 400);
        }
        return {visibility: visibility, timestamp: timestamp};
    }),
    async (c) => {
        const id = c.req.param("id");
        const { visibility, timestamp } = c.req.valid("json");
        const success = await DB_otp.updateVisibility(c.env.DB, c.get("userId"), id, visibility, timestamp);
        if (!success) {
            return c.json({error: "Failed to update visibility."}, 409);
        }
        return c.json({
            message: "Visibility updated successfully",
        }, 200);
    }
)

export default router;