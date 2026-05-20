import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import useAuthStore from '../../store/authStore';
import { ShieldAlert } from 'lucide-react';

const AppLayout = () => {
  const { user } = useAuthStore();
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar />
        {user && !user.isEmailVerified && (
          <div style={{ background: 'rgba(244,63,94,0.1)', borderBottom: '1px solid rgba(244,63,94,0.1)', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#f43f5e' }}>
            <ShieldAlert size={16} />
            <span>Your account is not fully verified. Some features may be restricted.</span>
            <Link to="/settings" style={{ color: '#f43f5e', fontWeight: 800, textDecoration: 'underline' }}>Verify Now</Link>
          </div>
        )}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ flex: 1, padding: '1.5rem', maxWidth: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <Outlet />
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
