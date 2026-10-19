// Updated: Fixed AuthProvider context structure - BrowserRouter > AuthProvider > AppContent
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { DarkModeProvider } from './context/DarkModeContext.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';

// Pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Services from './pages/Services.jsx';
import ServiceDetails from './pages/ServiceDetails.jsx';
import ProviderServices from './pages/ProviderServices.jsx';
import ProviderOnboarding from './pages/ProviderOnboarding.jsx';
import CreateService from './pages/CreateService.jsx';
import Bookings from './pages/Bookings.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import GuestSettings from './pages/GuestSettings.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Wallet from './pages/Wallet.jsx';

// Admin & Provider
import ProviderDashboard from './admin/ProviderDashboard.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminControl from './admin/AdminControl.jsx';

// Components
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/guest-settings" element={<GuestSettings />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected User Routes */}
          <Route
            path="/bookings"
            element={
              <ProtectedRoute roles={['user', 'provider', 'admin']}>
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['user', 'provider', 'admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute roles={['user', 'provider', 'admin']}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute roles={['user', 'provider', 'admin']}>
                <Wallet />
              </ProtectedRoute>
            }
          />

          {/* Protected Provider Routes */}
          <Route
            path="/provider/onboarding"
            element={
              <ProtectedRoute roles={['user', 'provider', 'admin']}>
                <ProviderOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute roles={['provider', 'admin']}>
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider"
            element={
              <ProtectedRoute roles={['provider', 'admin']}>
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/services"
            element={
              <ProtectedRoute roles={['provider', 'admin']}>
                <ProviderServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/services/create"
            element={
              <ProtectedRoute roles={['provider', 'admin']}>
                <CreateService />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/control"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminControl />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </DarkModeProvider>
  );
}
