import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import './App.css';

// Import components
import { ErrorBoundary } from './components/ErrorBoundary';

// Import pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { EnhancedFarmDashboard } from './pages/EnhancedFarmDashboard';
import { FarmsPage } from './pages/FarmsPage';
import { FieldsPage } from './pages/FieldsPage';
import { AnimalsPage } from './pages/AnimalsPage';
import { TasksPage } from './pages/TasksPage';
import { CropsPage } from './pages/CropsPage';
import { useAuth } from './hooks/useAuth';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="loading-spinner">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Home component with automatic redirect based on auth status
function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="loading-spinner">
        <div className="text-lg" data-testid="loading-text">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/farms" replace />;
  } else {
    return <LandingPage />;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <EnhancedFarmDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farms"
              element={
                <ProtectedRoute>
                  <FarmsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fields"
              element={
                <ProtectedRoute>
                  <FieldsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/animals"
              element={
                <ProtectedRoute>
                  <AnimalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crops"
              element={
                <ProtectedRoute>
                  <CropsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/queue"
              element={
                <ProtectedRoute>
                  <div>Queue Page</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}