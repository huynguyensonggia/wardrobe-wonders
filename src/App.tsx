import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import HomePage from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import TryOnPage from "@/pages/TryOnPage";
import UserDashboard from "@/pages/UserDashboard";
import MyRentals from "@/pages/dashboard/MyRentals";
import RentalHistory from "@/pages/dashboard/RentalHistory";
import Profile from "@/pages/dashboard/Profile";
import Settings from "@/pages/dashboard/Settings";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth pages without main layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Main layout routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/try-on" element={<TryOnPage />} />
              
              {/* User Dashboard */}
              <Route path="/dashboard" element={<UserDashboard />}>
                <Route index element={<MyRentals />} />
                <Route path="history" element={<RentalHistory />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* Admin Dashboard */}
              <Route path="/admin" element={<AdminDashboard />}>
                <Route path="products" element={<div className="text-center py-8 text-muted-foreground">Product management coming soon</div>} />
                <Route path="categories" element={<div className="text-center py-8 text-muted-foreground">Category management coming soon</div>} />
                <Route path="rentals" element={<div className="text-center py-8 text-muted-foreground">Rental management coming soon</div>} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
