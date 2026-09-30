const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseLocationMode = (value) => {
  return value === "provider" ? "provider" : "none";
};

export const loginSecurityRules = Object.freeze({
  session: Object.freeze({
    tokenBytes: parsePositiveInteger(process.env.AUTH_SESSION_TOKEN_BYTES, 32),
    ttlMinutes: parsePositiveInteger(process.env.AUTH_SESSION_TTL_MINUTES, 60),
    inactivityMinutes: parsePositiveInteger(
      process.env.AUTH_SESSION_INACTIVITY_MINUTES,
      30
    ),
  }),
  trustedDevice: Object.freeze({
    ttlDays: parsePositiveInteger(process.env.AUTH_TRUSTED_DEVICE_TTL_DAYS, 30),
    requiresServerToken: true,
    clientFingerprintTrusted: false,
  }),
  otp: Object.freeze({
    length: parsePositiveInteger(process.env.AUTH_OTP_LENGTH, 6),
    expiresInMinutes: parsePositiveInteger(process.env.AUTH_OTP_TTL_MINUTES, 10),
    resendCooldownSeconds: parsePositiveInteger(
      process.env.AUTH_OTP_RESEND_COOLDOWN_SECONDS,
      60
    ),
    maxAttempts: parsePositiveInteger(process.env.AUTH_OTP_MAX_ATTEMPTS, 5),
    maxRequestsPerHour: parsePositiveInteger(
      process.env.AUTH_OTP_MAX_REQUESTS_PER_HOUR,
      5
    ),
  }),
  loginActivity: Object.freeze({
    retentionDays: parsePositiveInteger(
      process.env.AUTH_LOGIN_ACTIVITY_RETENTION_DAYS,
      180
    ),
    storeIpAddress: true,
    storeUserAgent: true,
    locationMode: parseLocationMode(process.env.AUTH_LOCATION_MODE),
    unavailableLocation: null,
  }),
  errors: Object.freeze({
    invalidCredentials: "Invalid email or password.",
    verificationRequired: "Additional verification is required.",
    invalidVerification: "The verification code is invalid or expired.",
    sessionUnavailable: "Your session is no longer available.",
  }),
});

export const getLoginSecurityRules = () => loginSecurityRules;
