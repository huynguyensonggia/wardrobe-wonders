import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  Menu,
  X,
  ShoppingBag,
  User,
  Sparkles,
  LogOut,
  Settings,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

// Cấu trúc danh mục
const NAV_COLLECTIONS = [
  {
    key: "event",
    // Sự kiện = tiệc + cưới
    items: [
      { key: "dresses", occasion: "party", categorySlug: "dresses" },
      { key: "dresses", occasion: "wedding", categorySlug: "dresses" },
      { key: "tops", occasion: "party", categorySlug: "tops" },
      { key: "tops", occasion: "wedding", categorySlug: "tops" },
      { key: "pants", occasion: "party", categorySlug: "pants" },
      { key: "outerwear", occasion: "party", categorySlug: "outerwear" },
    ],
    // Link tổng: filter occasion=party,wedding
    occasions: ["party", "wedding"],
  },
  {
    key: "trend",
    // Xu hướng = thường ngày
    items: [
      { key: "dresses", occasion: "casual", categorySlug: "dresses" },
      { key: "tops", occasion: "casual", categorySlug: "tops" },
      { key: "pants", occasion: "casual", categorySlug: "pants" },
      { key: "outerwear", occasion: "casual", categorySlug: "outerwear" },
    ],
    occasions: ["casual"],
  },
  {
    key: "traditional",
    items: [
      { key: "aoDai", occasion: null, categorySlug: "ao-dai" },
    ],
    occasions: [],
  },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const setLang = (lng: "en" | "vi" | "ja") => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">
              AI CLOSET
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Bộ sưu tập - link thẳng */}
            <Link
              to="/products"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("navbar.collection")}
            </Link>

            {/* 3 dropdown danh mục */}
            {NAV_COLLECTIONS.map((col) => (
              <DropdownMenu key={col.key}>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none">
                  {t(`navbar.${col.key}`)}
                  <ChevronDown className="w-3.5 h-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {/* Link tổng cho collection */}
                  <DropdownMenuItem asChild>
                    <Link to={
                      col.occasions.length > 0
                        ? `/products?occasion=${col.occasions[0]}`
                        : `/products`
                    }>
                      {t("navbar.collection")} ({t(`navbar.${col.key}`)})
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Với event/trend: hiện theo category + occasion */}
                  {col.key !== "traditional"
                    ? Array.from(new Set(col.items.map((i) => i.categorySlug))).map((slug) => (
                        <DropdownMenuItem key={slug} asChild>
                          <Link to={`/products?category=${slug}&occasion=${col.occasions.join(",")}`}>
                            {t(`navbar.${col.items.find((i) => i.categorySlug === slug)?.key ?? slug}`)}
                          </Link>
                        </DropdownMenuItem>
                      ))
                    : col.items.map((item) => (
                        <DropdownMenuItem key={item.categorySlug} asChild>
                          <Link to={`/products?category=${item.categorySlug}`}>
                            {t(`navbar.${item.key}`)}
                          </Link>
                        </DropdownMenuItem>
                      ))
                  }
                </DropdownMenuContent>
              </DropdownMenu>
            ))}

            <Link
              to="/try-on-suggest"
              className="flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold/80 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {t("navbar.aiTryOn")}
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language selector */}
            <LanguageSwitcher />

            {/* Cart button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("/cart")}
              aria-label={t("navbar.cart")}
            >
              <ShoppingBag className="w-5 h-5" />
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full
                  bg-destructive text-destructive-foreground text-xs
                  flex items-center justify-center"
                >
                  {count}
                </span>
              )}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="User">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>

                  <DropdownMenuSeparator />

                  {user?.role === "ADMIN" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          {t("navbar.adminDashboard")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      {t("navbar.myRentals")}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      {t("navbar.settings")}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("navbar.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">{t("navbar.signIn")}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{t("navbar.joinNow")}</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={t("navbar.menu")}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-border py-4 animate-slide-down">
            <div className="flex flex-col gap-4">
              {/* Language selector in mobile */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("language.label")}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setLang("en")}>
                    EN
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setLang("vi")}>
                    VI
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setLang("ja")}>
                    JA
                  </Button>
                </div>
              </div>

              <Link
                to="/products"
                className="text-sm font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                {t("navbar.collection")}
              </Link>

              {/* Mobile: 3 danh mục có sub-items */}
              {NAV_COLLECTIONS.map((col) => (
                <div key={col.key} className="space-y-1">
                  <Link
                    to={col.occasions.length > 0 ? `/products?occasion=${col.occasions[0]}` : `/products`}
                    className="text-sm font-medium py-2 block"
                    onClick={() => setIsOpen(false)}
                  >
                    {t(`navbar.${col.key}`)}
                  </Link>
                  <div className="pl-4 space-y-1 border-l border-border">
                    {col.key !== "traditional"
                      ? Array.from(new Set(col.items.map((i) => i.categorySlug))).map((slug) => (
                          <Link
                            key={slug}
                            to={`/products?category=${slug}&occasion=${col.occasions.join(",")}`}
                            className="text-sm text-muted-foreground py-1.5 block"
                            onClick={() => setIsOpen(false)}
                          >
                            {t(`navbar.${col.items.find((i) => i.categorySlug === slug)?.key ?? slug}`)}
                          </Link>
                        ))
                      : col.items.map((item) => (
                          <Link
                            key={item.categorySlug}
                            to={`/products?category=${item.categorySlug}`}
                            className="text-sm text-muted-foreground py-1.5 block"
                            onClick={() => setIsOpen(false)}
                          >
                            {t(`navbar.${item.key}`)}
                          </Link>
                        ))
                    }
                  </div>
                </div>
              ))}

              <Link
                to="/try-on-suggest"
                className="flex items-center gap-1.5 text-sm font-medium py-2 text-gold"
                onClick={() => setIsOpen(false)}
              >
                <Sparkles className="w-4 h-4" />
                {t("navbar.aiTryOn")}
              </Link>

              {/* Cart in mobile menu */}
              <button
                className="text-left text-sm font-medium py-2"
                onClick={() => {
                  navigate("/cart");
                  setIsOpen(false);
                }}
              >
                {t("navbar.cart")} {count > 0 ? `(${count})` : ""}
              </button>

              <div className="pt-4 border-t border-border">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="block text-sm font-medium py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      {t("navbar.myRentals")}
                    </Link>

                    {user?.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        className="block text-sm font-medium py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        {t("navbar.adminDashboard")}
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="text-sm font-medium py-2 text-destructive"
                    >
                      {t("navbar.signOut")}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        {t("navbar.signIn")}
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/register" onClick={() => setIsOpen(false)}>
                        {t("navbar.joinNow")}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
