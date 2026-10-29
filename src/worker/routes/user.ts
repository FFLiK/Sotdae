import { Hono } from "hono";
import { requireSession } from "./session-middleware";
import { SessionCheckedEnv } from "./session-middleware";
import { DB_user } from "../db/user-repository";
const router = new Hono<SessionCheckedEnv>();

router.use("*", requireSession);

router.get(
    "/email",
    async (c) => {
        const userId = c.get("userId");
        const email = await DB_user.getEmail(c.env.DB, userId);
        if (email) {
            return c.json({ email, message: "Email retrieved successfully" }, 200);
        }
        return c.json({ error: "User not found" }, 404);
    }
)

export default router;