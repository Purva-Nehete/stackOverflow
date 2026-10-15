import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n/I18nContext";
import { isSupportedLocale, localeNames, supportedLocales, type Locale } from "@/lib/i18n/config";

type SecuritySession = {
  id: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

type TrustedDevice = {
  id: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

type ReputationPrivileges = {
  unrestrictedCommenting: boolean;
  editCommunityPosts: boolean;
  voteToCloseQuestions: boolean;
  reportInappropriateContent: boolean;
};

type ReputationActivityEntry = {
  id: string;
  amount: number;
  balanceAfter: number;
  eventType: string;
  createdAt: string;
};

type ReputationTransferEntry = {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
};

type TransferRecipient = {
  id: string;
  name: string;
  email: string;
  reputation: number;
};

const SettingsPage = () => {
  const router = useRouter();
  const { user, updateUser, Logout } = useAuth();
  const { t, locale, setLocale, formatDate, formatNumber } = useI18n();
  const currentLocale = (user?.preferredLanguage as Locale | undefined) || locale;
  const [selectedLocale, setSelectedLocale] = useState<Locale>(currentLocale);
  const [otp, setOtp] = useState("");
  const [channel, setChannel] = useState<"email" | "mobile" | null>(null);
  const [phone, setPhone] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securityActionId, setSecurityActionId] = useState<string | null>(null);
  const [reputation, setReputation] = useState(0);
  const [privileges, setPrivileges] = useState<ReputationPrivileges>({
    unrestrictedCommenting: false,
    editCommunityPosts: false,
    voteToCloseQuestions: false,
    reportInappropriateContent: false,
  });
  const [reputationLoading, setReputationLoading] = useState(false);
  const [reputationError, setReputationError] = useState("");
  const [activity, setActivity] = useState<ReputationActivityEntry[]>([]);
  const [activityOffset, setActivityOffset] = useState(0);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [activityLoadingMore, setActivityLoadingMore] = useState(false);
  const [transfers, setTransfers] = useState<ReputationTransferEntry[]>([]);
  const [transferOffset, setTransferOffset] = useState(0);
  const [transferHasMore, setTransferHasMore] = useState(false);
  const [transferLoadingMore, setTransferLoadingMore] = useState(false);
  const [allowance, setAllowance] = useState({ transferred: 0, remaining: 0, limit: 100 });
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipients, setRecipients] = useState<TransferRecipient[]>([]);
  const [receiverId, setReceiverId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (isSupportedLocale(user.preferredLanguage)) {
      setSelectedLocale(user.preferredLanguage);
    } else {
      setSelectedLocale(locale);
    }
    if (user.phone) {
      setPhone(user.phone);
    }
  }, [user, locale, router]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let cancelled = false;
    const loadSecurityData = async () => {
      setSecurityLoading(true);
      setSecurityError("");
      try {
        const [sessionResponse, deviceResponse] = await Promise.all([
          axiosInstance.get("/user/sessions"),
          axiosInstance.get("/user/trusted-devices"),
        ]);
        if (!cancelled) {
          setSessions(sessionResponse.data?.data || []);
          setTrustedDevices(deviceResponse.data?.data || []);
        }
      } catch (securityRequestError: any) {
        if (!cancelled) {
          setSecurityError(securityRequestError.response?.data?.message || t("common.error"));
        }
      } finally {
        if (!cancelled) {
          setSecurityLoading(false);
        }
      }
    };

    loadSecurityData();
    return () => {
      cancelled = true;
    };
  }, [user, t]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }
    let cancelled = false;
    const loadReputationData = async () => {
      setReputationLoading(true);
      setReputationError("");
      try {
        const [summaryResponse, activityResponse, transferResponse, allowanceResponse] =
          await Promise.all([
            axiosInstance.get("/user/reputation"),
            axiosInstance.get("/user/reputation/activity", { params: { limit: 10, offset: 0 } }),
            axiosInstance.get("/user/reputation/transfers", { params: { limit: 10, offset: 0 } }),
            axiosInstance.get("/user/reputation/transfers/allowance"),
          ]);

        if (cancelled) return;
        setReputation(summaryResponse.data?.data?.reputation || 0);
        setPrivileges(summaryResponse.data?.data?.privileges || {});
        setActivity(activityResponse.data?.data || []);
        setActivityOffset(activityResponse.data?.nextOffset || 0);
        setActivityHasMore(Boolean(activityResponse.data?.hasMore));
        setTransfers(transferResponse.data?.data || []);
        setTransferOffset(transferResponse.data?.nextOffset || 0);
        setTransferHasMore(Boolean(transferResponse.data?.hasMore));
        setAllowance(
          allowanceResponse.data?.data || { transferred: 0, remaining: 0, limit: 100 }
        );
      } catch (reputationRequestError: any) {
        if (!cancelled) {
          setReputationError(reputationRequestError.response?.data?.message || t("common.error"));
        }
      } finally {
        if (!cancelled) {
          setReputationLoading(false);
        }
      }
    };

    loadReputationData();
    return () => {
      cancelled = true;
    };
  }, [user, t]);

  useEffect(() => {
    if (!user || !recipientQuery.trim()) {
      setRecipients([]);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await axiosInstance.get("/user/reputation/transfers/recipients", {
          params: { query: recipientQuery, limit: 8 },
        });
        if (!cancelled) {
          setRecipients(response.data?.data || []);
        }
      } catch {
        if (!cancelled) setRecipients([]);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [recipientQuery, user]);

  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  const requestOtp = async () => {
    if (!isSupportedLocale(selectedLocale)) {
      return;
    }

    if (resolvedChannel === "mobile" && !user?.phone) {
      const phonePattern = /^\+[1-9]\d{7,14}$/;
      if (!phonePattern.test(phone.trim())) {
        setError(t("settings.invalidMobile"));
        return;
      }
    }

    setIsSending(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.post("/user/language/request-otp", {
        preferredLanguage: selectedLocale,
        verificationChannel: resolvedChannel,
        phone: phone.trim() || undefined,
      });

      const nextChannel =
        (response.data?.data?.channel as "email" | "mobile" | undefined) ||
        (selectedLocale === "fr" ? "email" : "mobile");

      setChannel(nextChannel);
      setVerificationSent(true);
      setOtp("");
      setCountdown(60);
      setSuccess(response.data?.message || t("settings.pendingMessage"));
    } catch (requestError: any) {
      setVerificationSent(false);
      setChannel(null);
      setError(requestError.response?.data?.message || t("common.error"));
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setError(t("common.error"));
      return;
    }

    setIsVerifying(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.patch("/user/language", {
        preferredLanguage: selectedLocale,
        otp: otp.trim(),
      });

      setLocale(selectedLocale);
      updateUser({ preferredLanguage: selectedLocale });
      setVerificationSent(false);
      setChannel(null);
      setOtp("");
      setSelectedLocale(selectedLocale);
      setSuccess(response.data?.message || t("settings.success"));
    } catch (verifyError: any) {
      setError(verifyError.response?.data?.message || t("common.error"));
    } finally {
      setIsVerifying(false);
    }
  };

  const languageChanged = selectedLocale !== currentLocale;
  const resolvedChannel = channel ?? (selectedLocale === "fr" ? "email" : "mobile");

  const revokeSession = async (session: SecuritySession) => {
    if (!window.confirm(t("settings.revokeConfirm"))) {
      return;
    }

    setSecurityActionId(session.id);
    setSecurityError("");
    try {
      await axiosInstance.delete(`/user/sessions/${session.id}`);
      if (session.isCurrent) {
        await Logout();
        await router.push("/auth");
        return;
      }
      setSessions((current) => current.filter((item) => item.id !== session.id));
    } catch (revokeError: any) {
      setSecurityError(revokeError.response?.data?.message || t("common.error"));
    } finally {
      setSecurityActionId(null);
    }
  };

  const revokeTrustedDevice = async (device: TrustedDevice) => {
    if (!window.confirm(t("settings.removeDeviceConfirm"))) {
      return;
    }

    setSecurityActionId(device.id);
    setSecurityError("");
    try {
      await axiosInstance.delete(`/user/trusted-devices/${device.id}`);
      setTrustedDevices((current) => current.filter((item) => item.id !== device.id));
    } catch (revokeError: any) {
      setSecurityError(revokeError.response?.data?.message || t("common.error"));
    } finally {
      setSecurityActionId(null);
    }
  };

  const loadMoreActivity = async () => {
    if (!activityHasMore) return;
    setActivityLoadingMore(true);
    try {
      const response = await axiosInstance.get("/user/reputation/activity", {
        params: { limit: 10, offset: activityOffset },
      });
      setActivity((current) => [...current, ...(response.data?.data || [])]);
      setActivityOffset(response.data?.nextOffset || activityOffset);
      setActivityHasMore(Boolean(response.data?.hasMore));
    } catch {
      setReputationError(t("common.error"));
    } finally {
      setActivityLoadingMore(false);
    }
  };

  const loadMoreTransfers = async () => {
    if (!transferHasMore) return;
    setTransferLoadingMore(true);
    try {
      const response = await axiosInstance.get("/user/reputation/transfers", {
        params: { limit: 10, offset: transferOffset },
      });
      setTransfers((current) => [...current, ...(response.data?.data || [])]);
      setTransferOffset(response.data?.nextOffset || transferOffset);
      setTransferHasMore(Boolean(response.data?.hasMore));
    } catch {
      setReputationError(t("common.error"));
    } finally {
      setTransferLoadingMore(false);
    }
  };

  const submitTransfer = async () => {
    const amount = Number.parseInt(transferAmount, 10);
    if (!receiverId || !Number.isInteger(amount) || amount <= 0 || !transferReason.trim()) {
      setReputationError("Please select a recipient, amount, and reason.");
      return;
    }
    setTransferSubmitting(true);
    setReputationError("");
    setTransferSuccess("");
    try {
      await axiosInstance.post("/user/reputation/transfers", {
        receiverId,
        amount,
        reason: transferReason.trim(),
      });
      setTransferSuccess("Reputation transferred successfully.");
      setReceiverId("");
      setRecipientQuery("");
      setRecipients([]);
      setTransferAmount("");
      setTransferReason("");

      const [summaryResponse, transferResponse, allowanceResponse] = await Promise.all([
        axiosInstance.get("/user/reputation"),
        axiosInstance.get("/user/reputation/transfers", { params: { limit: 10, offset: 0 } }),
        axiosInstance.get("/user/reputation/transfers/allowance"),
      ]);
      setReputation(summaryResponse.data?.data?.reputation || 0);
      setPrivileges(summaryResponse.data?.data?.privileges || {});
      setTransfers(transferResponse.data?.data || []);
      setTransferOffset(transferResponse.data?.nextOffset || 0);
      setTransferHasMore(Boolean(transferResponse.data?.hasMore));
      setAllowance(allowanceResponse.data?.data || allowance);
    } catch (transferError: any) {
      setReputationError(transferError.response?.data?.message || t("common.error"));
    } finally {
      setTransferSubmitting(false);
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-2xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.title")}</CardTitle>
            <CardDescription>{t("settings.languageDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{t("settings.currentLanguage")}</p>
              <p className="text-lg font-semibold">{localeNames[currentLocale]}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="language-select" className="text-sm font-medium text-gray-700">
                {t("settings.chooseLanguage")}
              </label>
              <select
                id="language-select"
                value={selectedLocale}
                onChange={(event) => {
                  const next = event.target.value as Locale;
                  setSelectedLocale(next);
                  setError("");
                  setSuccess("");
                  setVerificationSent(false);
                  setChannel(next === "fr" ? "email" : "mobile");
                  setOtp("");
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:outline-none"
              >
                {supportedLocales.map((localeCode) => (
                  <option key={localeCode} value={localeCode}>
                    {localeNames[localeCode]}
                  </option>
                ))}
              </select>
            </div>

            {languageChanged && (
              <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">{t("settings.verificationMethod")}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {(["email", "mobile"] as const).map((method) => (
                    <label key={method} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="language-verification-channel"
                        value={method}
                        checked={resolvedChannel === method}
                        onChange={() => setChannel(method)}
                        disabled={verificationSent}
                      />
                      {method === "email" ? t("settings.channelEmail") : t("settings.channelMobile")}
                    </label>
                  ))}
                </div>
              </div>
              {resolvedChannel === "mobile" && !verificationSent && (
                <div className="space-y-2">
                  <label htmlFor="language-phone" className="text-sm font-medium text-gray-700">
                    {t("settings.mobileNumber")}
                  </label>
                  <Input
                    id="language-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+14155550123"
                    autoComplete="tel"
                  />
                </div>
              )}
              <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {t("settings.channelInfo")}
                <span className="font-medium">
                  {resolvedChannel === "email"
                    ? ` ${t("settings.channelEmail")}`
                    : resolvedChannel === "mobile"
                      ? ` ${t("settings.channelMobile")}`
                      : ""}
                </span>
              </div>
              </>
            )}

            {languageChanged && !verificationSent && (
              <Button
                type="button"
                onClick={requestOtp}
                disabled={isSending}
                className="w-full"
              >
                {isSending ? t("common.processing") : t("settings.sendOtp")}
              </Button>
            )}

            {verificationSent && (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  verifyOtp();
                }}
              >
                <div className="space-y-2">
                  <label htmlFor="otp-input" className="text-sm font-medium text-gray-700">
                    {t("settings.enterOtp")}
                  </label>
                  <Input
                    id="otp-input"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" disabled={isVerifying || otp.length !== 6} className="flex-1">
                    {isVerifying ? t("common.processing") : t("settings.verify")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={requestOtp}
                    disabled={isSending || countdown > 0}
                    className="flex-1"
                  >
                    {countdown > 0 ? `${t("settings.resend")} (${countdown}s)` : t("settings.resend")}
                  </Button>
                </div>
              </form>
            )}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("settings.sessionsTitle")}</CardTitle>
            <CardDescription>{t("settings.sessionsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityLoading ? <p className="text-sm text-gray-600">{t("common.loading")}</p> : null}
            {!securityLoading && sessions.length === 0 ? (
              <p className="text-sm text-gray-600">{t("settings.noSessions")}</p>
            ) : null}
            {sessions.map((session) => (
              <div key={session.id} className="flex flex-col gap-3 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">
                    {session.browser} {t("settings.on")} {session.operatingSystem}
                    {session.isCurrent ? ` (${t("settings.currentSession")})` : ""}
                  </p>
                  <p className="text-gray-600">{t("settings.deviceType")}: {session.deviceType}</p>
                  <p className="text-gray-600">{t("settings.lastActivity")}: {formatDate(session.lastActivityAt)}</p>
                  <p className="text-gray-600">{t("settings.expires")}: {formatDate(session.expiresAt)}</p>
                </div>
                <Button
                  type="button"
                  variant={session.isCurrent ? "destructive" : "outline"}
                  onClick={() => revokeSession(session)}
                  disabled={securityActionId === session.id}
                >
                  {securityActionId === session.id ? t("common.processing") : t("settings.revoke")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("settings.devicesTitle")}</CardTitle>
            <CardDescription>{t("settings.devicesDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!securityLoading && trustedDevices.length === 0 ? (
              <p className="text-sm text-gray-600">{t("settings.noDevices")}</p>
            ) : null}
            {trustedDevices.map((device) => (
              <div key={device.id} className="flex flex-col gap-3 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-900">
                    {device.browser} {t("settings.on")} {device.operatingSystem}
                    {device.isCurrent ? ` (${t("settings.currentDevice")})` : ""}
                  </p>
                  <p className="text-gray-600">{t("settings.deviceType")}: {device.deviceType}</p>
                  <p className="text-gray-600">{t("settings.lastUsed")}: {formatDate(device.lastUsedAt)}</p>
                  <p className="text-gray-600">{t("settings.expires")}: {formatDate(device.expiresAt)}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => revokeTrustedDevice(device)}
                  disabled={securityActionId === device.id}
                  className="text-white hover:text-white disabled:text-white"
                >
                  {securityActionId === device.id ? t("common.processing") : t("settings.removeDevice")}
                </Button>
              </div>
            ))}
            {securityError ? <p className="text-sm text-red-600">{securityError}</p> : null}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Reputation</CardTitle>
            <CardDescription>View your reputation, privileges, and transfer allowance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {reputationLoading ? <p className="text-gray-600">{t("common.loading")}</p> : null}
            <p className="font-semibold text-gray-900">Total reputation: {formatNumber(reputation)}</p>
            <p className="text-gray-600">
              Daily transfer allowance: {formatNumber(allowance.remaining)} remaining of{" "}
              {formatNumber(allowance.limit)}
            </p>
            <p>Comment without restrictions: {privileges.unrestrictedCommenting ? "Unlocked" : "Locked"}</p>
            <p>Edit community posts: {privileges.editCommunityPosts ? "Unlocked" : "Locked"}</p>
            <p>Vote to close questions: {privileges.voteToCloseQuestions ? "Unlocked" : "Locked"}</p>
            <p>Report inappropriate content: {privileges.reportInappropriateContent ? "Unlocked" : "Locked"}</p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transfer reputation</CardTitle>
            <CardDescription>Send reputation points to another user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search recipient</label>
              <Input
                value={recipientQuery}
                onChange={(event) => {
                  const next = event.target.value;
                  setRecipientQuery(next);
                  setReceiverId("");
                }}
                placeholder="Search by name or email"
              />
              {recipients.length > 0 ? (
                <div className="max-h-40 overflow-auto rounded border border-gray-200">
                  {recipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                        receiverId === recipient.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        setReceiverId(recipient.id);
                        setRecipientQuery(`${recipient.name} (${recipient.email})`);
                        setRecipients([]);
                      }}
                    >
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-xs text-gray-600">{recipient.email}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <Input
                value={transferAmount}
                onChange={(event) => setTransferAmount(event.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="1 - 50"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Reason</label>
              <Input
                value={transferReason}
                onChange={(event) => setTransferReason(event.target.value)}
                placeholder="Why are you transferring points?"
                maxLength={500}
              />
            </div>

            <Button type="button" onClick={submitTransfer} disabled={transferSubmitting}>
              {transferSubmitting ? t("common.processing") : "Transfer reputation"}
            </Button>
            {transferSuccess ? <p className="text-sm text-green-600">{transferSuccess}</p> : null}
            {reputationError ? <p className="text-sm text-red-600">{reputationError}</p> : null}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Reputation activity</CardTitle>
            <CardDescription>How your reputation was earned or lost.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.length === 0 ? <p className="text-sm text-gray-600">No activity yet.</p> : null}
            {activity.map((entry) => (
              <div key={entry.id} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0 text-sm">
                <p className="font-medium text-gray-900">
                  {entry.amount > 0 ? `+${entry.amount}` : entry.amount} ({entry.eventType})
                </p>
                <p className="text-gray-600">Balance: {formatNumber(entry.balanceAfter)}</p>
                <p className="text-gray-500">{formatDate(entry.createdAt)}</p>
              </div>
            ))}
            {activityHasMore ? (
              <Button type="button" variant="outline" onClick={loadMoreActivity} disabled={activityLoadingMore}>
                {activityLoadingMore ? t("common.loading") : "Load more activity"}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transfer history</CardTitle>
            <CardDescription>Complete history of your sent and received transfers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {transfers.length === 0 ? <p className="text-sm text-gray-600">No transfers yet.</p> : null}
            {transfers.map((transfer) => (
              <div key={transfer.id} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0 text-sm">
                <p className="font-medium text-gray-900">
                  {String(transfer.senderId) === String(user?._id) ? "Sent" : "Received"}{" "}
                  {formatNumber(transfer.amount)} points
                </p>
                <p className="text-gray-600">{transfer.reason}</p>
                <p className="text-gray-500">{formatDate(transfer.createdAt)}</p>
              </div>
            ))}
            {transferHasMore ? (
              <Button type="button" variant="outline" onClick={loadMoreTransfers} disabled={transferLoadingMore}>
                {transferLoadingMore ? t("common.loading") : "Load more transfers"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Mainlayout>
  );
};

export default SettingsPage;
