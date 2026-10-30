import { Hono } from "hono";
import { validator } from "hono/validator";
import { setCookie } from 'hono/cookie'
import { Resend } from 'resend';
import { requireSession } from "./session-middleware";
const router = new Hono<{ Bindings: Env }>();

import { generateVerificationCode, codeMessage } from "../auth/verification-code";
import { createHmacCode, verifyHmacCode, createSHA256Hash } from "../auth/hashing";
import { emailCodeValidator } from "../validators/email-code-validator";
import { emailValidator } from "../validators/email-validator";
import { DB_challenge } from "../db/challenge-repository";
import { DB_session } from "../db/session-repository";
import { DB_user } from "../db/user-repository";
import EmailTemplate from "../email-templates/auth-email";
import { EMAIL_AUTH_POLICY, EMAIL_PIN_POLICY } from "../../shared/config/email-auth-policy";
import { WORKER_CONFIG } from "../config/worker-config";
import { WORKER_CONFIG_VALUES } from "../config/values";

router.get(
    "/session",
    requireSession,
    async (c) => {
        return c.json({ message: "Session is valid" }, 200);
    }
);

router.post(
    "/challenges", 
    validator("json", (value, c) => {
        const email = value["email"];
        const emailValidationResult = emailValidator(email);
        if (emailValidationResult) {
            return c.json({error: emailValidationResult.error}, emailValidationResult.status);
        }
        return {email: email};
    }),
    async (c) => {
        const { email } = c.req.valid("json");
        const normalized_email = email.toLowerCase();

        const created_at = Date.now();
        const expires_at = created_at + EMAIL_AUTH_POLICY.challengeTtlMs;

        const result = await DB_challenge.tryReserveEmailSend(c.env.DB, normalized_email, created_at, created_at);

        if (!result.allowed) {
            if (result.reason === "cooldown") {
                return c.json({error: "Too many requests. (Cooldown limit)", retryAt: result.retryAt }, 429);
            } else if (result.reason === "limit") {
                return c.json({error: "Too many requests. (Window limit)", retryAt: result.retryAt }, 429);
            } else {
                return c.json({error: "An unknown error occurred while trying to send the code."}, 500);
            }
        }

        const challenge_id = crypto.randomUUID();
        const challenge_code = generateVerificationCode(EMAIL_PIN_POLICY.PIN_LENGTH);
        const chalenge_code_hmac = await createHmacCode(codeMessage(normalized_email, challenge_id, challenge_code), c.env.EMAIL_CODE_PEPPER);

        try {
            const result = await DB_challenge.create(c.env.DB, challenge_id, normalized_email, chalenge_code_hmac, created_at, expires_at);
            if (!result) {
                return c.json({error: "A newer challenge already exists for this email."}, 409);
            }
        } catch {
            return c.json({error: "An unknown error occurred while trying to create the challenge."}, 500);
        }

        if (WORKER_CONFIG.SENDING_EMAIL(c.env.APP_ENV)) {
            const resend = new Resend(c.env.RESEND_API_KEY);
            const logoUrl = new URL(
                "/symbol.svg",
                c.env.APP_BASE_URL,
            ).toString();   
            try {
                const { error } = await resend.emails.send({
                from: `Sotdae Verification <${WORKER_CONFIG_VALUES.emailAuthSendingEmailAddress}>`,
                to: [email],
                subject: 'Sotdae Verification Code',
                react: EmailTemplate({ code: challenge_code, logoUrl: logoUrl }),
                });

                if (error) {
                    return Response.json({ error }, { status: 400 });
                }
            } catch (error) {
                console.log("Error sending email:", error);
                return Response.json({ error }, { status: 500 });
            }
        } else {
            console.log(`Challenge code for ${normalized_email}: ${challenge_code}`);
        }

        return c.json({ 
            message: `Challenge created for ${email}`,
            created_at: created_at,
            expires_at: expires_at,
            retryAt: result.retryAt
        }, 201);
    }
);

router.post(
    "/challenges/verify",
    validator("json", (value, c) => {
        const code = value["code"];
        const email = value["email"];

        const emailValidationResult = emailValidator(email);
        if (emailValidationResult) {
            return c.json({error: emailValidationResult.error}, emailValidationResult.status);
        }

        const codeValidationResult = emailCodeValidator(code);
        if (codeValidationResult) {
            return c.json({error: codeValidationResult.error}, codeValidationResult.status);
        }

        return {email: email, code: code};
    }),

    async (c) => {
        const { email, code } = c.req.valid("json");
        const normalized_email = email.toLowerCase();

        const challenge = await DB_challenge.get(c.env.DB, normalized_email);
        if (!challenge) {
            return c.json({error: "No challenge found for this email"}, 404);
        }

        if (new Date(challenge.expires_at) < new Date()) {
            try {
                const result = await DB_challenge.delete(c.env.DB, challenge.id);
                if (!result) {
                    return c.json({error: "Challenge has expired or already been deleted."}, 409);
                }
            } catch {
                return c.json({error: "An unknown error occurred while trying to delete the challenge."}, 500);
            }
            return c.json({error: "Challenge has expired"}, 400);
        }

        const verification = await verifyHmacCode(codeMessage(normalized_email, challenge.id, code), c.env.EMAIL_CODE_PEPPER, challenge.code_hmac);

        if (verification) {
            try {
                const result = await DB_challenge.delete(c.env.DB, challenge.id);
                if (!result) {
                    return c.json({error: "Challenge has expired or already been deleted."}, 409);
                }
            } catch {
                return c.json({error: "An unknown error occurred while trying to delete the challenge."}, 500);
            }

            let sessionKey: string | null = null;
            let hashedSession: string = "";
            const userId = await DB_user.getUserByEmail(c.env.DB, normalized_email);
            if (!userId) {
                return c.json({error: "Failed to create or get user."}, 500);
            }
            try {
                let result = null;
                let attempts = 0;
                while (!result) {
                    sessionKey = crypto.randomUUID();
                    hashedSession = await createSHA256Hash(sessionKey);
                    result = await DB_session.create(c.env.DB, hashedSession, userId.id, Date.now());
                    attempts++;
                    if (attempts > 5) {
                        return c.json({error: "Failed to create session."}, 500);
                    }
                }   
            } catch {
                return c.json({error: "An unknown error occurred while trying to create a session."}, 500);
            }
            if (sessionKey) {
                setCookie(c, "session_token", sessionKey, {
                    secure: true,
                    httpOnly: true,
                    maxAge: WORKER_CONFIG_VALUES.sessionAbsoluteDurationMs / 1000,
                    expires: new Date(Date.now() + WORKER_CONFIG_VALUES.sessionAbsoluteDurationMs),
                    sameSite: "Strict",
                });
            } else {
                return c.json({error: "Failed to create session."}, 500);
            }
            return c.json({ message: `Verification success` }, 200);
        } else {
            const failed_attempts = await DB_challenge.updateFailedAttempts(c.env.DB, challenge.id);
            if (!failed_attempts) {
                return c.json({error: "Challenge has expired or already been deleted."}, 409);
            }
            if (failed_attempts >= EMAIL_AUTH_POLICY.maxVerificationAttempts) {
                try {
                    const result = await DB_challenge.delete(c.env.DB, challenge.id);
                    if (!result) {
                        return c.json({error: "Challenge has expired or already been deleted."}, 409);
                    }
                } catch {
                    return c.json({error: "An unknown error occurred while trying to delete the challenge."}, 500);
                }
                return c.json({error: "Too many failed attempts."}, 400);
            }
            return c.json({error: "Wrong verification code", attempts: failed_attempts}, 400);
        }
    }
)

router.post(
    "/logout",
    validator("cookie", (value, c) => {
        const sessionToken = value["session_token"];
        if (!sessionToken) {
            return c.json({error: "Missing session token cookie."}, 400);
        }
        return {token: sessionToken};
    }),
    async (c) => {
        const sessionToken = c.req.valid("cookie")["token"];
        const hashedSession = await createSHA256Hash(sessionToken);
        try {
            const result = await DB_session.delete(c.env.DB, hashedSession);
            if (!result) {
                return c.json({error: "Session not found or already deleted."}, 404);
            }
            setCookie(c, "session_token", "", {
                secure: true,
                httpOnly: true,
                maxAge: 0,
                expires: new Date(0),
                sameSite: "Strict",
            });
            return c.json({ message: `Logout success` }, 200);
        } catch {
            return c.json({error: "An unknown error occurred while trying to delete the session."}, 500);
        }
    }
)

export default router;