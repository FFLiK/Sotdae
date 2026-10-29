import { Hono } from "hono";
import { requireSession } from "./session-middleware";
import { SessionCheckedEnv } from "./session-middleware";
import { validator } from "hono/validator";
import { DB_otp } from "../db/otp-repository";
import { DB_user } from "../db/user-repository";
import { decryptAESGCM, encryptAESGCM } from "../auth/aes-gcm";
import { generateOtpCode } from "../auth/hotp";
const router = new Hono<SessionCheckedEnv>();

router.use("*", requireSession);

router.post(
    "/",
    validator("json", (value, c) => {
        const title = value["title"];
        const serviceName = value["serviceName"];
        const otpKey = value["otpKey"];
        const emails = value["emails"];
        if (!title || !serviceName || !otpKey || !emails || !Array.isArray(emails)) {
            return c.json({ error: "Missing required fields" }, 400);
        }
        const isKeyValid = (key: string) => {
            const keyRegex = /^[A-Z2-7]{32}$/;
            return keyRegex.test(key);
        }
        if (!isKeyValid(otpKey)) {
            return c.json({ error: "Invalid OTP key format" }, 400);
        }
        for (const email of emails) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return c.json({ error: "Invalid email format" }, 400);
            }
        }
        return { title, serviceName, otpKey, emails };
    }),
    async (c) => {
        const { title, serviceName, otpKey, emails } = await c.req.json();
        const { cipherText: encryptedOtpKey, iv: optNonce } = await encryptAESGCM(otpKey, c.env.OTP_ENCRYPTION_KEY);
        const otpId = await DB_otp.createOtp(c.env.DB, title, serviceName, encryptedOtpKey, optNonce);
        if (!otpId) {
            return c.json({ error: "Failed to create OTP" }, 500);
        }
        const userId = c.get("userId");
        const relationResult = await DB_otp.createUserOtpRelation(c.env.DB, userId, otpId, true, true);
        if (!relationResult) {
            return c.json({ error: "Failed to create user-OTP relation" }, 500);
        }
        for (const email of emails) {
            const user = await DB_user.getUserByEmail(c.env.DB, email);
            if (!user) {
                return c.json({ error: `User with email ${email} not found` }, 404);
            }
            const relationResult = await DB_otp.createUserOtpRelation(c.env.DB, user.id, otpId, false, true);
            if (!relationResult) {
                return c.json({ error: "Failed to create user-OTP relation" }, 500);
            }
        }
        return c.json({ message: "OTP created successfully", otpId: otpId }, 201);
    }
)

export default router;