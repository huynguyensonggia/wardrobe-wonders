import { 
  User, 
  Product, 
  Category, 
  Rental, 
  ApiResponse, 
  PaginatedResponse, 
  ProductFilters,
  AdminStats,
  TryOnResult 
} from '@/types';

const API_BASE = '/api'; // Replace with actual API URL

// Helper function for API calls
async function fetchApi<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<ApiResponse<{ user: User; token: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string }) =>
    fetchApi<ApiResponse<{ user: User; token: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => fetchApi<ApiResponse<null>>('/auth/logout', { method: 'POST' }),

  getProfile: () => fetchApi<ApiResponse<User>>('/auth/profile'),

  updateProfile: (data: Partial<User>) =>
    fetchApi<ApiResponse<User>>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Products API
export const productsApi = {
  getAll: (filters?: ProductFilters, page = 1, pageSize = 12) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(filters && Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined)
      )),
    });
    return fetchApi<PaginatedResponse<Product>>(`/products?${params}`);
  },

  getById: (id: string) => fetchApi<ApiResponse<Product>>(`/products/${id}`),

  getFeatured: () => fetchApi<ApiResponse<Product[]>>('/products/featured'),

  create: (data: FormData) =>
    fetchApi<ApiResponse<Product>>('/admin/products', {
      method: 'POST',
      body: data,
      headers: {}, // Let browser set content-type for FormData
    }),

  update: (id: string, data: FormData) =>
    fetchApi<ApiResponse<Product>>(`/admin/products/${id}`, {
      method: 'PUT',
      body: data,
      headers: {},
    }),

  delete: (id: string) =>
    fetchApi<ApiResponse<null>>(`/admin/products/${id}`, {
      method: 'DELETE',
    }),
};

// Categories API
export const categoriesApi = {
  getAll: () => fetchApi<ApiResponse<Category[]>>('/categories'),

  create: (data: Partial<Category>) =>
    fetchApi<ApiResponse<Category>>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Category>) =>
    fetchApi<ApiResponse<Category>>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<ApiResponse<null>>(`/admin/categories/${id}`, {
      method: 'DELETE',
    }),
};

// Rentals API
export const rentalsApi = {
  getUserRentals: () => fetchApi<ApiResponse<Rental[]>>('/rentals'),

  create: (data: { productId: string; startDate: string; endDate: string }) =>
    fetchApi<ApiResponse<Rental>>('/rentals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    fetchApi<ApiResponse<Rental>>(`/rentals/${id}/cancel`, {
      method: 'POST',
    }),

  extend: (id: string, newEndDate: string) =>
    fetchApi<ApiResponse<Rental>>(`/rentals/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify({ endDate: newEndDate }),
    }),

  // Admin endpoints
  getAll: (page = 1, pageSize = 20) =>
    fetchApi<PaginatedResponse<Rental>>(`/admin/rentals?page=${page}&pageSize=${pageSize}`),

  updateStatus: (id: string, status: string) =>
    fetchApi<ApiResponse<Rental>>(`/admin/rentals/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// Admin API
export const adminApi = {
  getStats: () => fetchApi<ApiResponse<AdminStats>>('/admin/stats'),
};

// Try-On API
export const tryOnApi = {
  generateTryOn: async (userImage: File, productId: string): Promise<ApiResponse<TryOnResult>> => {
    const formData = new FormData();
    formData.append('userImage', userImage);
    formData.append('productId', productId);

    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE}/try-on`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Try-on failed' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  getHistory: () => fetchApi<ApiResponse<TryOnResult[]>>('/try-on/history'),
};
