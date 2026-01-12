import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen,
  ShoppingBag,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const sidebarLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
  { to: '/admin/rentals', icon: ShoppingBag, label: 'Rentals' },
];

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // Default to Overview content if at /admin
  const isOverview = location.pathname === '/admin';

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-semibold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your rental platform</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-8">
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
                  <ChevronRight className={cn("w-4 h-4 ml-auto", isActive && "rotate-90")} />
                </Link>
              );
            })}
          </nav>

          <div className="min-h-[500px]">
            {isOverview ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Products', value: '24', change: '+3 this week' },
                  { label: 'Active Rentals', value: '12', change: '+5 this week' },
                  { label: 'Revenue', value: '$4,250', change: '+12% vs last month' },
                  { label: 'Total Users', value: '156', change: '+8 this week' },
                ].map((stat, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-display font-semibold mt-1">{stat.value}</p>
                      <p className="text-xs text-accent mt-1">{stat.change}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
