import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShoppingBag, 
  User, 
  Clock,
  Settings,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { to: '/dashboard', icon: ShoppingBag, label: 'My Rentals', exact: true },
  { to: '/dashboard/history', icon: Clock, label: 'Rental History' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function UserDashboard() {
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
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold mb-2">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            Manage your rentals and account settings
          </p>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar */}
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = link.exact 
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);
              
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
                  <link.icon className="w-5 h-5" />
                  {link.label}
                  <ChevronRight className={cn(
                    "w-4 h-4 ml-auto transition-transform",
                    isActive && "rotate-90"
                  )} />
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
