import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

import authChallengeRoutes from "./routes/auth-challenges";
import otpRoutes from "./routes/get-otp";
import createOtpRoutes from "./routes/create-otp";
import userRoutes from "./routes/user";
import testRoutes from "./routes/test";

app.route("/api/user", userRoutes);
app.route("/api/auth", authChallengeRoutes);
app.route("/api/otp/create", createOtpRoutes);
app.route("/api/otp", otpRoutes);
app.route("/api/test", testRoutes);

export default app;