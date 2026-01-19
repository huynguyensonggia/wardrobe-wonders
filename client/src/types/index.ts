import type { VtonCategory } from "@/constants/vtonCategory";

// User types
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Product types
export type ProductStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  vtonCategory?: VtonCategory | string; // dùng string để tránh vỡ nếu BE trả khác enum
  isActive?: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: Category;
  images: ProductImage[];
  sizes: string[];
  colors: string[];
  pricePerDay: number;
  deposit: number;
  quantity: number;
  status: ProductStatus;
  featured: boolean;
  createdAt: string;
}

// Rental types
export type RentalStatus = 'PENDING' | 'ACTIVE' | 'RETURNED' | 'CANCELLED' | 'OVERDUE';

export interface Rental {
  id: string;
  product: Product;
  user: User;
  startDate: string;
  endDate: string;
  status: RentalStatus;
  totalPrice: number;
  depositPaid: number;
  createdAt: string;
}

// Try-On types
export interface TryOnRequest {
  userImage: File;
  productId: string;
}

export interface TryOnResult {
  id: string;
  originalImage: string;
  resultImage: string;
  productId: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types
export interface ProductFilters {
  category?: string;
  size?: string;
  color?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

// Dashboard stats
export interface AdminStats {
  totalProducts: number;
  activeRentals: number;
  totalRevenue: number;
  totalUsers: number;
  recentRentals: Rental[];
}
