import type { VtonCategory } from "@/constants/vtonCategory";
import { RentalStatus } from "./rental-status"

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

export interface ProductVariant {
  id: number;
  productId: number;
  size: string;
  stock: number;
  isActive?: number;
  createdAt?: string;
  updatedAt?: string;
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
  variants?: ProductVariant[];
}

// =====================
// Rental types (match BE)
// =====================

export interface RentalItem {
  id: number;

  // relations
  product: Product;

  // ✅ variant/size
  variantId: number;
  variant?: ProductVariant;

  // snapshot
  rentPricePerDay: number;
  quantity: number;
  days: number;
  subtotal: number;
}

export interface Rental {
  id: string;
  rentalCode?: string;

  user: User;

  startDate: string;
  endDate: string;
  totalDays: number;

  status: RentalStatus;

  totalPrice: number;
  totalDeposit: number;

  note?: string | null;

  // shipping
  shipFullName?: string | null;
  shipPhone?: string | null;
  shipAddress: string;
  shipNote?: string | null;

  items: RentalItem[];

  createdAt: string;
  updatedAt: string;
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
