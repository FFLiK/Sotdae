import { Hono } from "hono";
import { seedDemoOtpData } from "../demo/otpDemo";
const router = new Hono<{ Bindings: Env }>();

router.get("/", async (c) => {
    return c.json({ message: "Test route is working!" }, 200);
});

router.get("/otp", async (c) => {
    const key = c.env.OTP_ENCRYPTION_KEY;
    const otpList = await seedDemoOtpData(c.env.DB, key);
    return c.json({ message: "Demo OTP data seeded successfully.", otpList: otpList }, 200);
});

export default router;