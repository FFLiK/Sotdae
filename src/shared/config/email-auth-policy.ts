export const EMAIL_PIN_POLICY = {
  PIN_LENGTH: 6
}

export const EMAIL_AUTH_POLICY = {
  challengeTtlMs: 5 * 60 * 1000,
  maxVerificationAttempts: 5,
  resend: {
    cooldownMs: 10 * 1000,
    windowMs: 5 * 60 * 1000,
    maxPerWindow: 5,
  },
} as const;