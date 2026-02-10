import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/lib/api";
import type { AdminStats } from "@/types/admin-stats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

export default function AdminOverview() {
  const { t } = useTranslation();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);

      // ✅ BE trả object thô
      const res = await adminApi.getStats();
      setStats(res);
    } catch (e: any) {
      setErr(e?.message ?? t("adminOverview.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: t("adminOverview.cards.totalProducts"), value: stats.totalProducts },
      { label: t("adminOverview.cards.activeRentals"), value: stats.activeRentals },
      { label: t("adminOverview.cards.revenue"), value: money(stats.revenue) },
      { label: t("adminOverview.cards.totalUsers"), value: stats.totalUsers },
    ];
  }, [stats, t]);

  if (loading) return <p className="text-muted-foreground">{t("adminOverview.loading")}</p>;
  if (err) return <p className="text-red-500">{err}</p>;
  if (!stats) return null;

  const weekly = stats.weeklyRentals ?? [];
  const monthly = stats.monthlyRevenue ?? [];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("adminOverview.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("adminOverview.subtitle")}</p>
        </div>

        <Button variant="outline" onClick={load}>
          {t("common.refresh")}
        </Button>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-3xl font-display font-semibold mt-1">{c.value}</p>
              <p className="text-xs text-accent mt-1">{t("adminOverview.live")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Rentals */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium">{t("adminOverview.charts.weeklyRentals.title")}</p>
              <p className="text-xs text-muted-foreground">
                {t("adminOverview.charts.weeklyRentals.subtitle")}
              </p>
            </div>

            {weekly.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                {t("adminOverview.charts.weeklyRentals.empty")}
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium">{t("adminOverview.charts.monthlyRevenue.title")}</p>
              <p className="text-xs text-muted-foreground">
                {t("adminOverview.charts.monthlyRevenue.subtitle")}
              </p>
            </div>

            {monthly.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                {t("adminOverview.charts.monthlyRevenue.empty")}
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
