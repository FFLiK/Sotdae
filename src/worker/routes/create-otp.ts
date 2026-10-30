import { Hono } from "hono";
import { requireSession } from "./session-middleware";
import { SessionCheckedEnv } from "./session-middleware";
import { validator } from "hono/validator";
import { DB_otp } from "../db/otp-repository";
import { DB_user } from "../db/user-repository";
import { encryptAESGCM } from "../auth/aes-gcm";
import { emailValidator } from "../validators/email-validator";
const router = new Hono<SessionCheckedEnv>();

router.use("*", requireSession);

router.post(
    "/",
    validator("json", (value, c) => {
        let title = value["title"];
        let serviceName = value["serviceName"];
        const otpKey = value["otpKey"];
        const emails = value["emails"];
        if (!title || !serviceName || !otpKey || !emails || !Array.isArray(emails)) {
            return c.json({ error: "Missing required fields" }, 400);
        }
        if (typeof title !== "string" || typeof serviceName !== "string") {
            return c.json({ error: "Invalid title or serviceName format" }, 400);
        }
        title = title.trim();
        serviceName = serviceName.trim();
        if (title.length === 0 || serviceName.length === 0) {
            return c.json({ error: "Title and serviceName cannot be empty" }, 400);
        }
        const isKeyValid = (key: string) => {
            const keyRegex = /^[A-Z2-7]{32}$/;
            return keyRegex.test(key);
        }
        if (!isKeyValid(otpKey)) {
            return c.json({ error: "Invalid OTP key format" }, 400);
        }
        const emailSet = new Set<string>();
        for (const email of emails) {
            if (emailValidator(email)) {
                return c.json({ error: `Invalid email address: ${email}` }, 400);
            }
            const normalized_email = email.toLowerCase();
            emailSet.add(normalized_email);
        }
        return { title, serviceName, otpKey, emailSet };
    }),
    async (c) => {
        const { title, serviceName, otpKey, emailSet : emails } = await c.req.valid("json");
        try {
            const { cipherText: encryptedOtpKey, iv: optNonce } = await encryptAESGCM(otpKey, c.env.OTP_ENCRYPTION_KEY);
            const userId = c.get("userId");
            const otpId = await DB_otp.createOtp(c.env.DB, title, serviceName, encryptedOtpKey, optNonce, userId, true);
            if (!otpId) {
                throw new Error("OTP id is null");
            }
            let failedEmails: string[] = [];
            for (const email of emails) {
                try {
                    const user = await DB_user.getUserByEmail(c.env.DB, email);
                    if (!user) {
                        failedEmails.push(email);
                        continue;
                    }
                    if (user.id === userId) {
                        continue;
                    }
                    const relationResult = await DB_otp.createUserOtpRelation(c.env.DB, user.id, otpId, false, true);
                    if (!relationResult) {
                        failedEmails.push(email);
                    }
                } catch (error) {
                    console.error(`Error processing email ${email}:`, error);
                    failedEmails.push(email);
                }
            }
            if (failedEmails.length > 0) {
                return c.json({ message: "OTP created, but some users could not be added", otpId: otpId, failedEmails: failedEmails }, 207);
            }
            return c.json({ message: "OTP created successfully", otpId: otpId }, 201);
        } catch (error) {
            console.error("Error creating OTP:", error);
            return c.json({ error: "Failed to create OTP" }, 500);
        }
    }
)

export default router;