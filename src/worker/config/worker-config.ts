import { WORKER_CONFIG_VALUES } from "./values";

export const WORKER_CONFIG = {
  SENDING_EMAIL: shouldSendEmail,
} as const;

function shouldSendEmail(appEnv: string): boolean {
  if (appEnv === "release") return true;
  if (appEnv === "dev") return WORKER_CONFIG_VALUES.sendEmailInDev;
  throw new Error("Unknown APP_ENV");
}