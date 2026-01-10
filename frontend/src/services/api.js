// Handles HTTP requests
import axios from 'axios';

// Configures base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Creates Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injects JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handles 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Retries request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
           // Refreshes token
           const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
             refresh: refreshToken
           });
           const { access } = response.data;
           
           // Updates local storage
           localStorage.setItem('accessToken', access);
           originalRequest.headers.Authorization = `Bearer ${access}`;
           
           // Retries original request
           return api(originalRequest);
        }
      } catch {
        // Logs out if refresh fails
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Defines API endpoints

export const authAPI = {
  login: (credentials) => api.post('/auth/token/', credentials),
  register: (data) => api.post('/auth/register/', data),
  getMe: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
};

export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard/'),
  getPublicImpact: () => api.get('/analytics/public-impact/'),
  getDonationTrends: (days = 30) => api.get(`/analytics/donation-trends/?days=${days}`),
  getDonorPerformance: () => api.get('/analytics/donor-performance/'),
  getRecipientImpact: () => api.get('/analytics/recipient-impact/'),
  getFoodDistribution: () => api.get('/analytics/food-distribution/'),
  getUrgencyBreakdown: () => api.get('/analytics/urgency-breakdown/'),
  getVolunteerLeaderboard: () => api.get('/analytics/volunteer-leaderboard/'),
  getImpactOverTime: (days = 30) => api.get(`/analytics/impact-over-time/?days=${days}`),
};

export const donorsAPI = {
  getAll: () => api.get('/donors/'),
  getById: (id) => api.get(`/donors/${id}/`),
  getFoodItems: (id) => api.get(`/donors/${id}/food_items/`),
};

export const recipientsAPI = {
  getAll: () => api.get('/recipients/'),
  getById: (id) => api.get(`/recipients/${id}/`),
};

export const volunteersAPI = {
  getAll: () => api.get('/volunteers/'),
  getById: (id) => api.get(`/volunteers/${id}/`),
  toggleAvailability: (id) => api.post(`/volunteers/${id}/toggle_availability/`),
  getDeliveryRequests: () => api.get('/delivery-requests/'),
  acceptRequest: (id) => api.post(`/delivery-requests/${id}/accept/`),
  rejectRequest: (id) => api.post(`/delivery-requests/${id}/reject/`),
};

export const foodItemsAPI = {
  getAll: (params) => api.get('/food-items/', { params }),
  getById: (id) => api.get(`/food-items/${id}/`),
  create: (data) => api.post('/food-items/', data),
  update: (id, data) => api.patch(`/food-items/${id}/`, data),
  delete: (id) => api.delete(`/food-items/${id}/`),
  request: (id) => api.post(`/food-items/${id}/request_item/`, { quantity: 1 }),
  getUrgent: () => api.get('/food-items/urgent/'),
  getPrioritized: () => api.get('/food-items/prioritized/'),
};

export const foodCategoriesAPI = {
  getAll: () => api.get('/food-categories/'),
};

export const donationsAPI = {
  getAll: (params) => api.get('/donations/', { params }),
  getById: (id) => api.get(`/donations/${id}/`),
  claim: (id) => api.post(`/donations/${id}/claim/`),
  confirm: (id) => api.post(`/donations/${id}/confirm/`),
  cancel: (id) => api.post(`/donations/${id}/cancel/`),
  pickup: (id) => api.post(`/donations/${id}/pickup/`),
  deliver: (id) => api.post(`/donations/${id}/deliver/`),
  resolveException: (id, resolution) => api.post(`/donations/${id}/resolve_exception/`, { resolution }),
  confirmReceipt: (id, rating) => api.post(`/donations/${id}/confirm_receipt/`, { rating }),
};

export default api;
