export const WORKER_CONFIG_VALUES = {
  sendEmailInDev: false,
  emailAuthSendingEmailAddress: "sotdae@fflik.kr",
  sessionDurationMs: 30 * 60 * 1000, // 30 minutes
  sessionAbsoluteDurationMs: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;