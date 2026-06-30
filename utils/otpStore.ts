// In-memory store to share mock OTPs across API routes during development/testing
// without a database connection.

type OtpData = {
  code: string;
  expiresAt: number;
  attempts: number;
};

// Global object to persist across serverless hot reloads in development
const globalStore = global as unknown as {
  mockEmailOtps: Record<string, OtpData>;
  mockPhoneOtps: Record<string, OtpData>;
};

if (!globalStore.mockEmailOtps) {
  globalStore.mockEmailOtps = {};
}

if (!globalStore.mockPhoneOtps) {
  globalStore.mockPhoneOtps = {};
}

export const otpStore = {
  setEmailOtp(email: string, code: string) {
    globalStore.mockEmailOtps[email.toLowerCase()] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };
  },
  
  getEmailOtp(email: string) {
    return globalStore.mockEmailOtps[email.toLowerCase()] || null;
  },

  incrementEmailAttempts(email: string) {
    const record = globalStore.mockEmailOtps[email.toLowerCase()];
    if (record) {
      record.attempts += 1;
    }
  },

  clearEmailOtp(email: string) {
    delete globalStore.mockEmailOtps[email.toLowerCase()];
  },

  setPhoneOtp(phone: string, code: string) {
    globalStore.mockPhoneOtps[phone] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };
  },

  getPhoneOtp(phone: string) {
    return globalStore.mockPhoneOtps[phone] || null;
  },

  incrementPhoneAttempts(phone: string) {
    const record = globalStore.mockPhoneOtps[phone];
    if (record) {
      record.attempts += 1;
    }
  },

  clearPhoneOtp(phone: string) {
    delete globalStore.mockPhoneOtps[phone];
  },
};
