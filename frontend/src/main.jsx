import React from 'react';
import ReactDOM from 'react-dom/client';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Styling
import './index.css';

// Context Auth Store
import { AuthProvider } from './store/AuthContext';

// Route Guards
import AuthGuard from './pages/auth/AuthGuard';
import AdminGuard from './pages/auth/AdminGuard';

// Layout shell
import Layout from './components/layout/Layout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

// Student Page Views
import StudentDashboard from './pages/student/Dashboard';
import StudentExplore from './pages/student/Explore';
import StudentApplications from './pages/student/Applications';
import StudentDailyLogs from './pages/student/DailyLogs';
import StudentProfile from './pages/student/Profile';
import ScrollDemoPage from './pages/student/ScrollDemoPage';

// Admin Page Views
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/Users';
import AdminInternships from './pages/admin/Internships';
import AdminApplications from './pages/admin/Applications';
import AdminDailyLogs from './pages/admin/DailyLogs';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Unauthenticated Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Authenticated Layout Shell (Gated by AuthGuard) */}
            <Route element={<AuthGuard />}>
              <Route element={<Layout />}>
                {/* Default student landing overview */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Student Pages */}
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/explore" element={<StudentExplore />} />
                <Route path="/applications" element={<StudentApplications />} />
                <Route path="/daily-logs" element={<StudentDailyLogs />} />
                <Route path="/profile" element={<StudentProfile />} />
                <Route path="/scroll-demo" element={<ScrollDemoPage />} />

                {/* Administrative Pages (Double Gated by AdminGuard) */}
                <Route element={<AdminGuard />}>
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/internships" element={<AdminInternships />} />
                  <Route path="/admin/applications" element={<AdminApplications />} />
                  <Route path="/admin/daily-logs" element={<AdminDailyLogs />} />
                </Route>
              </Route>
            </Route>

            {/* General Catch-All Catch Redirects */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        
        {/* Central Toast Toaster */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              fontSize: '13px',
              fontWeight: '500',
              padding: '12px 16px',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f8fafc',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f8fafc',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
