import { Hono } from "hono";
import { requireSession } from "./session-middleware";
import { SessionCheckedEnv } from "./session-middleware";
const router = new Hono<SessionCheckedEnv>();

router.use("*", requireSession);

router.get(
    "/",
    async (c) => {
        console.log("OTP route hit");
        return c.json({});
    }
)

export default router;