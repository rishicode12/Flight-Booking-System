import axios from 'axios';

// API base URL - prefer Vite env, fall back safely to process env if present
let viteApiUrl;
try {
  viteApiUrl = import.meta?.env?.VITE_API_URL;
} catch (e) {
  viteApiUrl = undefined;
}

const API_BASE_URL = viteApiUrl || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    // Silently ignore seed endpoint errors (flights may already exist)
    if (!error.config?.url?.includes('/flights/seed')) {
      console.error('API Error:', message);
    }
    return Promise.reject(new Error(message));
  }
);

// Flight API calls
export const flightAPI = {
  // Seed flights into database (run once)
  seedFlights: async () => {
    return apiClient.post('/flights/seed');
  },

  // Get all flights (10 flights)
  getAllFlights: async () => {
    return apiClient.get('/flights');
  },

  // Search flights
  searchFlights: async (from, to) => {
    return apiClient.get('/flights/search', {
      params: { from, to },
    });
  },
};

// Booking API calls
export const bookingAPI = {
  // Create a new booking
  createBooking: async (bookingData) => {
    return apiClient.post('/bookings', bookingData);
  },

  // Get user's bookings
  getMyBookings: async () => {
    return apiClient.get('/bookings');
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    return apiClient.get(`/bookings/${bookingId}`);
  },

  // Download ticket PDF
  downloadTicket: async (bookingId) => {
    return apiClient.get(`/bookings/${bookingId}/ticket`, {
      responseType: 'blob',
    });
  },
};

// Wallet API calls
export const walletAPI = {
  // Get wallet balance
  getBalance: async (userId) => {
    return apiClient.get('/wallet', {
      params: { userId },
    });
  },

  // Deduct from wallet
  deductBalance: async (userId, amount, description = '') => {
    return apiClient.post('/wallet/deduct', {
      userId,
      amount,
      description,
    });
  },
};

export default apiClient;
