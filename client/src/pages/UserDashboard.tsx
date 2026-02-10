import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, User, Clock, Settings, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const sidebarLinks = [
  { to: "/dashboard", icon: ShoppingBag, labelKey: "dashboard.sidebar.myRentals", exact: true },
  { to: "/dashboard/history", icon: Clock, labelKey: "dashboard.sidebar.rentalHistory" },
  { to: "/dashboard/profile", icon: User, labelKey: "dashboard.sidebar.profile" },
  { to: "/dashboard/settings", icon: Settings, labelKey: "dashboard.sidebar.settings" },
];

export default function UserDashboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const firstName =
    (user as any)?.name?.trim()?.split(/\s+/)?.[0] || t("dashboard.fallback.firstName");

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold mb-2">
            {t("dashboard.header.welcomeBack", { name: firstName })}
          </h1>
          <p className="text-muted-foreground">{t("dashboard.header.subtitle")}</p>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar */}
          <nav className="space-y-1" aria-label={t("dashboard.sidebar.aria")}>
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
                  {t(link.labelKey)}
                  <ChevronRight
                    className={cn("w-4 h-4 ml-auto transition-transform", isActive && "rotate-90")}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Content */}
          <div className="min-h-[500px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
