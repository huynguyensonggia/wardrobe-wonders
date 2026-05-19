import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { FloatingSupportButton } from "@/components/FloatingSupportButton";
import { ChatWidget } from "@/components/ChatWidget";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

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
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminRentals from "@/pages/admin/AdminRentals";
import AdminReturnedRentals from "@/pages/admin/AdminReturnedRentals";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminAccessories from "@/pages/admin/AdminAccessories";
import CartPage from "@/pages/CartPage";
import StyleAdvisorPage from "@/pages/StyleAdvisorPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import SizeGuidePage from "@/pages/SizeGuidePage";
import ShippingReturnsPage from "@/pages/ShippingReturnsPage";
import FAQPage from "@/pages/FAQPage";
import AboutPage from "@/pages/AboutPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";
import PrivateRoute from "@/components/auth/PrivateRoute";
import ContactPage from "@/pages/ContactPage";
import CategoryPage from "@/pages/CategoryPage";

// ✅ NEW: Checkout page
import CheckoutPage from "@/pages/CheckoutPage";
import Favorites from "@/pages/dashboard/Favorites";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
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
                <Route path="/style-advisor" element={<StyleAdvisorPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/size-guide" element={<SizeGuidePage />} />
                <Route
                  path="/shipping-returns"
                  element={<ShippingReturnsPage />}
                />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/cart" element={
                  <PrivateRoute>
                    <CartPage />
                  </PrivateRoute>
                } />

                {/* ✅ NEW: Checkout */}
                <Route
                  path="/checkout"
                  element={
                    <PrivateRoute>
                      <CheckoutPage />
                    </PrivateRoute>
                  }
                />
                <Route path="/order-success" element={<OrderSuccessPage />} />

                {/* User Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <UserDashboard />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<MyRentals />} />
                  <Route path="history" element={<RentalHistory />} />
                  <Route path="favorites" element={<Favorites />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Admin Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                >
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="rentals" element={<AdminRentals />} />
                  <Route path="rentals/returned" element={<AdminReturnedRentals />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="accessories" element={<AdminAccessories />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingSupportButton />
            <ChatWidget />
            <PWAInstallPrompt />
          </BrowserRouter>
        </TooltipProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
