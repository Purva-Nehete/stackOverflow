import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n/I18nContext";

type LoginActivity = {
  id: string;
  user?: { name?: string; email?: string };
  outcome: string;
  isNewDevice: boolean;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  ipAddress: string;
  location: { country?: string; region?: string; city?: string } | null;
  loggedInAt: string;
};

type ActivityFilters = {
  outcome: string;
  deviceType: string;
  userId: string;
  ipAddress: string;
  location: string;
  from: string;
  to: string;
};

const emptyFilters: ActivityFilters = {
  outcome: "",
  deviceType: "",
  userId: "",
  ipAddress: "",
  location: "",
  from: "",
  to: "",
};

const LoginActivityPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { t, formatDate } = useI18n();
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      return;
    }

    let cancelled = false;
    const loadActivity = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ limit: "25" });
        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
        const response = await axiosInstance.get(`/moderation/login-activity?${params.toString()}`);
        if (!cancelled) {
          setActivities(response.data?.data || []);
          setNextCursor(response.data?.nextCursor || null);
          setHasMore(Boolean(response.data?.hasMore));
        }
      } catch (requestError: any) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || t("common.error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadActivity();
    return () => {
      cancelled = true;
    };
  }, [user, appliedFilters, t]);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const loadNextPage = async () => {
    if (!nextCursor) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "25", cursor: nextCursor });
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const response = await axiosInstance.get(`/moderation/login-activity?${params.toString()}`);
      setActivities((current) => [...current, ...(response.data?.data || [])]);
      setNextCursor(response.data?.nextCursor || null);
      setHasMore(Boolean(response.data?.hasMore));
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <Mainlayout>
      <div className="mx-auto max-w-6xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.loginActivityTitle")}</CardTitle>
            <CardDescription>{t("admin.loginActivityDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="grid gap-3 md:grid-cols-4" onSubmit={applyFilters}>
              <select
                aria-label={t("admin.outcome")}
                value={filters.outcome}
                onChange={(event) => setFilters({ ...filters, outcome: event.target.value })}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">{t("admin.allOutcomes")}</option>
                <option value="success">success</option>
                <option value="verification_required">verification_required</option>
                <option value="verification_failed">verification_failed</option>
                <option value="failure">failure</option>
              </select>
              <select
                aria-label={t("admin.deviceType")}
                value={filters.deviceType}
                onChange={(event) => setFilters({ ...filters, deviceType: event.target.value })}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">{t("admin.allDevices")}</option>
                <option value="desktop">desktop</option>
                <option value="mobile">mobile</option>
                <option value="tablet">tablet</option>
                <option value="unknown">unknown</option>
              </select>
              <Input aria-label={t("admin.userId")} placeholder={t("admin.userId")} value={filters.userId} onChange={(event) => setFilters({ ...filters, userId: event.target.value })} />
              <Input aria-label={t("admin.ipAddress")} placeholder={t("admin.ipAddress")} value={filters.ipAddress} onChange={(event) => setFilters({ ...filters, ipAddress: event.target.value })} />
              <Input aria-label={t("admin.location")} placeholder={t("admin.location")} value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} />
              <Input aria-label={t("admin.from")} type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
              <Input aria-label={t("admin.to")} type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
              <Button type="submit" disabled={loading}>{loading ? t("common.processing") : t("admin.applyFilters")}</Button>
            </form>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {!loading && activities.length === 0 ? <p className="text-sm text-gray-600">{t("admin.noActivity")}</p> : null}

            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border-b border-gray-200 pb-4 text-sm last:border-b-0">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{activity.user?.name || activity.user?.email || t("admin.unknownUser")}</p>
                      <p className="text-gray-600">{activity.outcome} {activity.isNewDevice ? `| ${t("admin.newDevice")}` : ""}</p>
                    </div>
                    <p className="text-gray-600">{formatDate(activity.loggedInAt)}</p>
                  </div>
                  <p className="mt-2 text-gray-600">
                    {activity.browser} {t("settings.on")} {activity.operatingSystem} | {activity.deviceType} | {activity.ipAddress}
                  </p>
                  {activity.location ? <p className="text-gray-600">{[activity.location.city, activity.location.region, activity.location.country].filter(Boolean).join(", ")}</p> : null}
                </div>
              ))}
            </div>

            {hasMore ? <Button type="button" variant="outline" onClick={loadNextPage} disabled={loading}>{t("admin.loadMore")}</Button> : null}
          </CardContent>
        </Card>
      </div>
    </Mainlayout>
  );
};

export default LoginActivityPage;
