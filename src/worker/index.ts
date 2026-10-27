import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

import authChallengeRoutes from "./routes/auth-challenges";
import otpRoutes from "./routes/otp";

app.route("/api/auth", authChallengeRoutes);
app.route("/api/otp", otpRoutes);

export default app;