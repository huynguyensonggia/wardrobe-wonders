import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useTranslation } from "react-i18next";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AdminOverview() {
  const { t } = useTranslation();

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats(),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        {t("adminOverview.loading")}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">{t("adminOverview.errors.loadFailed")}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const cards = [
    {
      label: t("adminOverview.cards.totalProducts"),
      value: stats.totalProducts,
      icon: Package,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: t("adminOverview.cards.activeRentals"),
      value: stats.activeRentals,
      icon: ShoppingBag,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: t("adminOverview.cards.revenue"),
      value: stats.revenue,
      icon: TrendingUp,
      format: (v: number) => `${v.toLocaleString("vi-VN")}đ`,
    },
    {
      label: t("adminOverview.cards.totalUsers"),
      value: stats.totalUsers,
      icon: Users,
      format: (v: number) => v.toLocaleString(),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {t("adminOverview.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("adminOverview.subtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          {t("adminOverview.live")}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-secondary rounded-xl p-5 border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="font-display text-2xl font-semibold">
                {card.format(card.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Rentals */}
        <div className="bg-secondary rounded-xl p-5 border border-border">
          <h3 className="font-semibold mb-1">
            {t("adminOverview.charts.weeklyRentals.title")}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {t("adminOverview.charts.weeklyRentals.subtitle")}
          </p>
          {stats.weeklyRentals?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.weeklyRentals} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("adminOverview.charts.weeklyRentals.empty")}
            </p>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="bg-secondary rounded-xl p-5 border border-border">
          <h3 className="font-semibold mb-1">
            {t("adminOverview.charts.monthlyRevenue.title")}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {t("adminOverview.charts.monthlyRevenue.subtitle")}
          </p>
          {stats.monthlyRevenue?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.monthlyRevenue} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}K`
                      : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v.toLocaleString("vi-VN")}đ`, ""]}
                />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("adminOverview.charts.monthlyRevenue.empty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
