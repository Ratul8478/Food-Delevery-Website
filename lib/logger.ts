import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "email",
      "phone",
      "otp",
      "password",
      "stripe_key",
      "body.email",
      "body.phone",
      "body.password",
      "body.otp",
      "headers.authorization",
      "user.email",
      "user.phone",
      "user_metadata.email",
      "user_metadata.phone"
    ],
    censor: "[REDACTED]"
  }
});
