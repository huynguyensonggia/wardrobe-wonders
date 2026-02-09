import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api";
import type { AdminStats } from "@/types/admin-stats";
import { Card, CardContent } from "@/components/ui/card";

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
      setErr(e?.message ?? "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Total Products", value: stats.totalProducts },
      { label: "Active Rentals", value: stats.activeRentals },
      { label: "Revenue", value: money(stats.revenue) },
      { label: "Total Users", value: stats.totalUsers },
    ];
  }, [stats]);

  if (loading) return <p className="text-muted-foreground">Loading dashboard...</p>;
  if (err) return <p className="text-red-500">{err}</p>;
  if (!stats) return null;

  const weekly = stats.weeklyRentals ?? [];
  const monthly = stats.monthlyRevenue ?? [];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">Live data from server</p>
        </div>

        <button
          onClick={load}
          className="px-3 py-2 rounded-md border text-sm hover:bg-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-3xl font-display font-semibold mt-1">{c.value}</p>
              <p className="text-xs text-accent mt-1">Live</p>
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
              <p className="font-medium">Weekly Rentals</p>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>

            {weekly.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                No rentals in last 7 days.
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
              <p className="font-medium">Monthly Revenue</p>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>

            {monthly.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                No revenue data yet.
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
