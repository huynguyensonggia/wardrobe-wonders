import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationsApi, type AppNotification } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const TYPE_ICON: Record<string, string> = {
  RENTAL_CREATED: "🎉",
  RENTAL_SHIPPING: "🚚",
  RENTAL_ACTIVE: "✅",
  RENTAL_COMPLETED: "🙏",
  RENTAL_CANCELLED: "❌",
  RENTAL_REJECTED: "⛔",
  RETURN_REMINDER: "⏰",
  PAYMENT_SUCCESS: "💳",
  REFUND_SUCCESS: "💰",
  STOCK_AVAILABLE: "🛍️",
  SYSTEM: "📢",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

export function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    try {
      const { count } = await notificationsApi.getUnreadCount();
      setUnread(count);
    } catch {}
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
      setUnread(data.filter((n) => !n.isRead).length);
    } catch {} finally {
      setLoading(false);
    }
  };

  // Poll unread count every 60s
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (!open) fetchAll();
    setOpen((v) => !v);
  };

  const markRead = async (id: number) => {
    await notificationsApi.markRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnread((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const deleteOne = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationsApi.deleteOne(id).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setNotifications((prev) => {
      const remaining = prev.filter((n) => n.id !== id);
      setUnread(remaining.filter((n) => !n.isRead).length);
      return remaining;
    });
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleOpen}
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-background border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">Thông báo</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Chưa có thông báo</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={cn(
                    "flex gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/40 transition-colors",
                    !n.isRead && "bg-primary/5"
                  )}
                >
                  <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "📢"}</span>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium leading-tight", !n.isRead && "font-semibold")}>
                      {n.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      {n.message}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</div>
                  </div>
                  <button
                    onClick={(e) => deleteOne(n.id, e)}
                    className="shrink-0 text-muted-foreground hover:text-destructive text-xs mt-0.5"
                    title="Xóa"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
