import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../utils/errorUtils';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { access_token, user } = response.data;

          localStorage.setItem('athena_token', access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

          set({ user, token: access_token, isAuthenticated: true, isLoading: false });
          toast.success(`Welcome back, ${user.full_name}!`);
          return { success: true, user };
        } catch (error) {
          set({ isLoading: false });
          const message = extractErrorMessage(error, 'Login failed');
          toast.error(message);
          return { success: false, error: message };
        }
      },

      signup: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', userData);
          const { access_token, user } = response.data;

          localStorage.setItem('athena_token', access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

          set({ user, token: access_token, isAuthenticated: true, isLoading: false });
          toast.success('Account created successfully!');
          return { success: true, user };
        } catch (error) {
          set({ isLoading: false });
          const message = extractErrorMessage(error, 'Registration failed');
          toast.error(message);
          return { success: false, error: message };
        }
      },

      logout: () => {
        localStorage.removeItem('athena_token');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false });
        toast.success('Logged out successfully');
      },

      checkAuth: () => {
        const token = localStorage.getItem('athena_token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const { user } = get();
          if (user) {
            set({ isAuthenticated: true, token });
          }
        }
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
    }),
    {
      name: 'athena-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
