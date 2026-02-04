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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">
              WARDROBE WONDERS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              to="/products"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Collection
            </Link>
            <Link
              to="/products?category=dresses"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dresses
            </Link>
            <Link
              to="/products?category=tops"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tops
            </Link>
            <Link
              to="/products?category=pants"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pants
            </Link>
            <Link
              to="/products?category=outerwear"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Outerwear
            </Link>
            <Link
              to="/try-on-suggest"
              className="flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold/80 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              AI Try-On
            </Link>
          </div>  

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* ✅ Cart button replaces Search */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("/cart")}
              aria-label="Cart"
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
                  <Button variant="ghost" size="icon" className="relative">
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
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      My Rentals
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Join Now</Link>
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
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-border py-4 animate-slide-down">
            <div className="flex flex-col gap-4">
              <Link
                to="/products"
                className="text-sm font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Collection
              </Link>

              <Link
                to="/products?category=dresses"
                className="text-sm font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Dresses
              </Link>

              <Link
                to="/products?category=outerwear"
                className="text-sm font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Outerwear
              </Link>

              <Link
                to="/try-on-suggest"
                className="flex items-center gap-1.5 text-sm font-medium py-2 text-gold"
                onClick={() => setIsOpen(false)}
              >
                <Sparkles className="w-4 h-4" />
                AI Try-On
              </Link>

              {/* ✅ Cart in mobile menu */}
              <button
                className="text-left text-sm font-medium py-2"
                onClick={() => {
                  navigate("/cart");
                  setIsOpen(false);
                }}
              >
                Cart {count > 0 ? `(${count})` : ""}
              </button>

              <div className="pt-4 border-t border-border">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="block text-sm font-medium py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      My Rentals
                    </Link>

                    {user?.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        className="block text-sm font-medium py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="text-sm font-medium py-2 text-destructive"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/register" onClick={() => setIsOpen(false)}>
                        Join Now
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
