import {
  User,
  Product,
  Category,
  Rental,
  ApiResponse,
  PaginatedResponse,
  ProductFilters,
} from "@/types";
import type { AdminStats } from "@/types/admin-stats";
import type { BEProduct } from "@/types/backend";
import { mapBEProductToMock } from "@/lib/mappers";

// ✅ NEW: dùng type RentalStatus thay vì string
import type { RentalStatus } from "@/types/rental-status";

const API_BASE = import.meta.env.VITE_API_BASE;

// Helper function for API calls
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("auth_token");

  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  // ✅ chỉ set Content-Type JSON khi KHÔNG phải FormData
  if (!isFormData) {
    if (!("Content-Type" in (headers as any))) {
      (headers as any)["Content-Type"] = "application/json";
    }
  } else {
    // ✅ FormData: tuyệt đối không set Content-Type
    if ("Content-Type" in (headers as any)) delete (headers as any)["Content-Type"];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{
      access_token: string;
      user: User;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string }) =>
    fetchApi<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => fetchApi<ApiResponse<null>>("/auth/logout", { method: "POST" }),

  getProfile: () => fetchApi<ApiResponse<User>>("/auth/profile"),

  updateProfile: (data: Partial<User>) =>
    fetchApi<ApiResponse<User>>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Products API
export const productsApi = {
  // PUBLIC
  getAll: async (filters?: ProductFilters) => {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters ?? {}).filter(([, v]) => v !== undefined && v !== "")
      ) as Record<string, string>
    );

    const qs = params.toString();
    const beList = await fetchApi<BEProduct[]>(qs ? `/products?${qs}` : "/products");
    return beList.map(mapBEProductToMock);
  },

  // ✅ NEW: Featured (nếu BE support query featured + limit)
  getFeatured: async (limit = 4) => {
    // ưu tiên gọi thẳng server để nhẹ
    try {
      const beList = await fetchApi<BEProduct[]>(`/products?featured=true&limit=${limit}`);
      return beList.map(mapBEProductToMock);
    } catch {
      // fallback: nếu BE chưa support featured query => lấy all rồi filter
      const all = await productsApi.getAll();
      return all.filter((p: any) => p.featured).slice(0, limit);
    }
  },

  getById: async (id: string) => {
    const be = await fetchApi<BEProduct>(`/products/${id}`);
    return mapBEProductToMock(be);
  },

  // ADMIN
  create: (data: FormData) =>
    fetchApi<Product>("/admin/products", {
      method: "POST",
      body: data,
    }),

  update: (id: string, data: FormData) =>
    fetchApi<Product>(`/admin/products/${id}`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: string) =>
    fetchApi<{ message: string } | { deleted: boolean }>(`/admin/products/${id}`, {
      method: "DELETE",
    }),

  // ✅ IMPORT EXCEL
  importExcel: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);

    return fetchApi<{
      total: number;
      imported: number;
      failedCount: number;
      failed?: any[];
      success?: any[];
    }>("/admin/products/import-excel", {
      method: "POST",
      body: fd,
    });
  },
};

// Categories API
export const categoriesApi = {
  getAll: () => fetchApi<Category[]>("/categories"),

  create: (data: Partial<Category>) =>
    fetchApi<ApiResponse<Category>>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Category>) =>
    fetchApi<ApiResponse<Category>>(`/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<ApiResponse<null>>(`/admin/categories/${id}`, {
      method: "DELETE",
    }),
};

// Rentals API
export const rentalsApi = {
  getUserRentals: () => fetchApi<ApiResponse<Rental[]>>("/rentals"),

  // ✅ create rental: items có variantId
  create: (data: {
    startDate: string;
    endDate: string;
    items: { productId: number; variantId: number; quantity: number }[];
    note?: string;

    shipFullName: string;
    shipPhone: string;
    shipAddress: string;
    shipNote?: string;
    paymentMethod?: "CASH" | "COD" | "BANK_TRANSFER";
  }) =>
    fetchApi<ApiResponse<Rental>>("/rentals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    fetchApi<ApiResponse<Rental>>(`/rentals/${id}/cancel`, {
      method: "PATCH",
    }),

  extend: (id: string, newEndDate: string) =>
    fetchApi<ApiResponse<Rental>>(`/rentals/${id}/extend`, {
      method: "POST",
      body: JSON.stringify({ endDate: newEndDate }),
    }),

  // Admin endpoints
  getAll: (page = 1, pageSize = 20) =>
    fetchApi<PaginatedResponse<Rental>>(
      `/admin/rentals?page=${page}&pageSize=${pageSize}`
    ),

  // ✅ FIX: status dùng RentalStatus (khớp BE)
  updateStatus: (id: string, status: RentalStatus) =>
    fetchApi<ApiResponse<Rental>>(`/admin/rentals/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // ✅ update shipping
  updateShipping: (
    id: string,
    data: {
      shipFullName?: string;
      shipPhone?: string;
      shipAddress?: string;
      shipNote?: string;
    }
  ) =>
    fetchApi<ApiResponse<Rental>>(`/admin/rentals/${id}/shipping`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  refundDeposit: (id: string) =>
    fetchApi<{ refunded: boolean; count: number }>(`/admin/rentals/${id}/refund-deposit`, {
      method: "PATCH",
    }),

  addSurcharge: (id: string, data: { type: string; amount: number; note?: string }) =>
    fetchApi<ApiResponse<Rental>>(`/admin/rentals/${id}/surcharges`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  setActualReturn: (id: string, actualReturnDate: string) =>
    fetchApi<ApiResponse<Rental>>(`/admin/rentals/${id}/actual-return`, {
      method: "PATCH",
      body: JSON.stringify({ actualReturnDate }),
    }),

  checkAvailability: (variantId: number, startDate: string, endDate: string) =>
    fetchApi<{ available: boolean }>(
      `/admin/rentals/check-availability?variantId=${variantId}&startDate=${startDate}&endDate=${endDate}`
    ),
};

export const adminApi = {
  // BE trả object thô, không bọc {data:...}
  getStats: () => fetchApi<AdminStats>("/admin/stats"),
};


// =============================
// ✅ Admin Users API
// endpoint BE: /admin/users
// =============================
export const adminUsersApi = {
  // GET /admin/users
  getAll: () => fetchApi<User[]>("/admin/users"),

  // GET /admin/users/:id (nếu bạn có làm)
  getById: (id: number | string) => fetchApi<User>(`/admin/users/${id}`),

  // PATCH /admin/users/:id
  update: (id: number | string, data: Partial<User> & { password?: string }) =>
    fetchApi<User>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // DELETE /admin/users/:id
  delete: (id: number | string) =>
    fetchApi<{ message: string }>(`/admin/users/${id}`, {
      method: "DELETE",
    }),
};

// =============================
// ✅ Try-On API (ONE-STEP)
// endpoint: POST /tryon/fitdit
// =============================
export type FitditOneStepResponse = {
  inputs: { personUrl: string; garmentUrl: string };
  outputs: string[];
  resultUrl: string | null;
  preview?: { maskUrl?: string | null; poseUrl?: string | null };
  raw?: any;
};

export type FitditOffsets = { top: number; bottom: number; left: number; right: number };

export type FitditOptions = {
  resolution?: "768x1024" | "1152x1536" | "1536x2048";
  nSteps?: number;
  imageScale?: number;
  seed?: number;
  numImages?: number;
};

export const tryOnApi = {
  runTryOn: (args: {
    productId: string | number;
    person?: File;
    personUrl?: string;
    offsets?: FitditOffsets;
    opts?: FitditOptions;
  }) => {
    const { productId, person, personUrl, offsets, opts } = args;

    const safePersonUrl = typeof personUrl === "string" ? personUrl.trim() : "";

    if (!person && !safePersonUrl) {
      throw new Error("Missing person or personUrl");
    }

    const fd = new FormData();
    fd.append("productId", String(productId));

    if (person) fd.append("person", person);
    if (safePersonUrl) fd.append("personUrl", safePersonUrl);

    if (offsets) fd.append("offsetsJson", JSON.stringify(offsets));

    if (opts?.resolution) fd.append("resolution", opts.resolution);
    if (opts?.nSteps !== undefined) fd.append("nSteps", String(opts.nSteps));
    if (opts?.imageScale !== undefined) fd.append("imageScale", String(opts.imageScale));
    if (opts?.seed !== undefined) fd.append("seed", String(opts.seed));
    if (opts?.numImages !== undefined) fd.append("numImages", String(opts.numImages));

    return fetchApi<FitditOneStepResponse>("/tryon/fitdit", {
      method: "POST",
      body: fd,
    });
  },
};
