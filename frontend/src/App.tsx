// App entry point with routing and providers
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FarmThemeProvider } from './components/mui/theme';
import { ModernHeader } from './components/mui/Header';
import { ModernDashboard } from './components/mui/ModernDashboard';
import { AuthProvider } from './hooks/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FarmThemeProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                  {/* Protected routes with header */}
                  <Route
                    path="/*"
                    element={
                      <>
                        <ModernHeader />
                        <main>
                          <Routes>
                            <Route path="/dashboard" element={<ModernDashboard />} />
                            {/* Add more protected routes as needed */}
                          </Routes>
                        </main>
                      </>
                    }
                  />
                </Routes>
              </div>
            </Router>
          </FarmThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
