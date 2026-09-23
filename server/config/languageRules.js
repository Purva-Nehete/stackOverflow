const supportedLanguages = Object.freeze({
  en: Object.freeze({ name: "English", verificationChannel: "mobile" }),
  es: Object.freeze({ name: "Spanish", verificationChannel: "mobile" }),
  hi: Object.freeze({ name: "Hindi", verificationChannel: "mobile" }),
  pt: Object.freeze({ name: "Portuguese", verificationChannel: "mobile" }),
  zh: Object.freeze({ name: "Chinese", verificationChannel: "mobile" }),
  fr: Object.freeze({ name: "French", verificationChannel: "email" }),
});

export const languageRules = Object.freeze({
  defaultLanguage: "en",
  supportedLanguages,
  otp: Object.freeze({
    length: 6,
    expiresInMinutes: 10,
    resendCooldownSeconds: 60,
    maxAttempts: 5,
    maxRequestsPerHour: 5,
    pendingRequestExpiresInMinutes: 15,
  }),
  errors: Object.freeze({
    unsupportedLanguage: "UNSUPPORTED_LANGUAGE",
    missingEmail: "EMAIL_VERIFICATION_UNAVAILABLE",
    missingPhone: "MOBILE_VERIFICATION_UNAVAILABLE",
    invalidOtp: "INVALID_OTP",
    expiredOtp: "OTP_EXPIRED",
    attemptsExceeded: "OTP_ATTEMPTS_EXCEEDED",
    resendUnavailable: "OTP_RESEND_UNAVAILABLE",
    requestRateLimited: "OTP_REQUEST_RATE_LIMITED",
    verificationRequired: "LANGUAGE_VERIFICATION_REQUIRED",
  }),
});

export const isSupportedLanguage = (language) => {
  return typeof language === "string" && language in supportedLanguages;
};

export const getLanguageRule = (language) => {
  return isSupportedLanguage(language) ? supportedLanguages[language] : null;
};

export const getVerificationChannel = (language) => {
  return getLanguageRule(language)?.verificationChannel || null;
};

export const getSupportedLanguageCodes = () => {
  return Object.keys(supportedLanguages);
};
