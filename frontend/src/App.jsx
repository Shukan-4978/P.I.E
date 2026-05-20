import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import { connectSocket, disconnectSocket } from './lib/socket';
import useNotificationStore from './store/notificationStore';
import { getSocket } from './lib/socket';

// Layouts
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Verify from './pages/Auth/Verify';

// Protected pages
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import FounderDashboard from './pages/Dashboard/FounderDashboard';
import InvestorDashboard from './pages/Dashboard/InvestorDashboard';
import CreateStartup from './pages/Startup/CreateStartup';
import EditStartup from './pages/Startup/EditStartup';
import StartupProfile from './pages/Startup/StartupProfile';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import AIAnalysis from './pages/AIAnalysis';
import AIChatbot from './pages/AIChatbot';
import Pricing from './pages/Pricing';
import Billing from './pages/Billing';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminStartups from './pages/Admin/AdminStartups';
import AdminInvestments from './pages/Admin/AdminInvestments';
import AdminReports from './pages/Admin/AdminReports';
import AdminAIAnalysis from './pages/Admin/AdminAIAnalysis';
import AdminPayments from './pages/Admin/AdminPayments';
import About from './pages/Static/About';
import Help from './pages/Static/Help';
import MyInvestments from './pages/Investor/MyInvestments';
import Legal from './pages/Static/Legal';
import PaymentSuccess from './pages/PaymentSuccess';
import NotFound from './pages/NotFound';

// Route guards
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (!token) return children;
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/feed'} replace />;
};

const AdminRoute = ({ children }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/feed" replace />;
  return children;
};

function App() {
  const { user, token } = useAuthStore();
  const { initTheme } = useThemeStore();
  const { addNotification } = useNotificationStore();

  // Initialize theme
  useEffect(() => {
    initTheme();
  }, []);

  // Connect socket when authenticated
  useEffect(() => {
    if (token && user?._id) {
      const socket = connectSocket(user._id);

      socket.on('new_notification', (notification) => {
        addNotification(notification);
      });

      return () => {
        socket.off('new_notification');
      };
    } else {
      disconnectSocket();
    }
  }, [token, user?._id]);

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(var(--bg-card-rgb), 0.8)',
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '12px 20px',
            fontSize: '0.9rem',
            fontWeight: '600',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxWidth: '450px',
            letterSpacing: '-0.01em',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
            style: {
              borderLeft: '4px solid #10b981',
            },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#fff' },
            style: {
              borderLeft: '4px solid #f43f5e',
            },
          },
          loading: {
            style: {
              borderLeft: '4px solid #6366f1',
            },
          },
        }}
      />

      <ErrorBoundary>
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Legal />} />
        <Route path="/terms" element={<Legal />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/dashboard" element={
            user?.role === 'founder' ? <FounderDashboard /> : <InvestorDashboard />
          } />
          <Route path="/startups/create" element={<CreateStartup />} />
          <Route path="/startups/:id/edit" element={<EditStartup />} />
          <Route path="/startups/:id" element={<StartupProfile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:conversationId" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ai-analysis" element={<AIAnalysis />} />
          <Route path="/ai-analysis/:id" element={<AIAnalysis />} />
          <Route path="/ai-advisor" element={<AIChatbot />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/my-investments" element={<MyInvestments />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/startups" element={<AdminStartups />} />
          <Route path="/admin/investments" element={<AdminInvestments />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/ai-analysis" element={<AdminAIAnalysis />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
