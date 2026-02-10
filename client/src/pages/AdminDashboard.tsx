import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingBag,
  ChevronRight,
  ArrowLeft,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ NEW: Overview thật
import AdminOverview from "@/pages/admin/AdminOverview";

import { useTranslation } from "react-i18next";

// ✅ normalize role để không bị lệch "ADMIN" vs "admin"
function isAdminRole(role?: string) {
  return (role ?? "").toLowerCase() === "admin";
}

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const sidebarLinks = [
    { to: "/admin", icon: LayoutDashboard, label: t("admin.sidebar.overview"), exact: true },
    { to: "/admin/users", icon: Users, label: t("admin.sidebar.users") },
    { to: "/admin/products", icon: Package, label: t("admin.sidebar.products") },
    { to: "/admin/categories", icon: FolderOpen, label: t("admin.sidebar.categories") },
    { to: "/admin/rentals", icon: ShoppingBag, label: t("admin.sidebar.rentals") },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ✅ FIX: role check (ADMIN/admin)
  if (!isAuthenticated || !isAdminRole(user?.role as any)) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  const isOverview = location.pathname === "/admin";

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground"
            aria-label={t("admin.backHome")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <h1 className="font-display text-3xl font-semibold">
              {t("admin.title")}
            </h1>
            <p className="text-muted-foreground">{t("admin.subtitle")}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-8">
          <nav className="space-y-1" aria-label={t("admin.sidebar.aria")}>
            {sidebarLinks.map((link) => {
              const isActive = link.exact
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);

              const Icon = link.icon;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                  <ChevronRight
                    className={cn("w-4 h-4 ml-auto", isActive && "rotate-90")}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="min-h-[500px]">
            {/* ✅ Overview dùng data thật */}
            {isOverview ? <AdminOverview /> : <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
}
