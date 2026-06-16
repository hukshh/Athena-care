import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Eager load public pages for fast initial render
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Lazy load protected and admin pages to split chunks
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ReportAnalyzerPage = lazy(() => import('./pages/reports/ReportAnalyzerPage'));
const HospitalMatchingPage = lazy(() => import('./pages/hospitals/HospitalMatchingPage'));
const DoctorsPage = lazy(() => import('./pages/doctors/DoctorsPage'));
const CostPredictorPage = lazy(() => import('./pages/cost/CostPredictorPage'));
const TravelPlannerPage = lazy(() => import('./pages/travel/TravelPlannerPage'));
const ChatbotPage = lazy(() => import('./pages/chatbot/ChatbotPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

// Store
import { useAuthStore } from './store/authStore';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-slate-950">
            <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Patient Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportAnalyzerPage /></ProtectedRoute>} />
            <Route path="/hospitals" element={<ProtectedRoute><HospitalMatchingPage /></ProtectedRoute>} />
            <Route path="/doctors" element={<ProtectedRoute><DoctorsPage /></ProtectedRoute>} />
            <Route path="/cost-predictor" element={<ProtectedRoute><CostPredictorPage /></ProtectedRoute>} />
            <Route path="/travel-planner" element={<ProtectedRoute><TravelPlannerPage /></ProtectedRoute>} />
            <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </Router>
  );
}

export default App;
