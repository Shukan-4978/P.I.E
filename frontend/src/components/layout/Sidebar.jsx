import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Rss, Rocket, MessageCircle, Bell, Brain,
  CreditCard, Settings, LogOut, Users, Shield, FileText, ChevronLeft, ChevronRight, TrendingUp, Bookmark, Compass, Sparkles, Lock
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const founderNav = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/feed', icon: Rss, label: 'Feed' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/startups/create', icon: Rocket, label: 'My Startup' },
    { path: '/ai-analysis', icon: Brain, label: 'AI Analysis' },
    { path: '/ai-advisor', icon: Sparkles, label: 'AI Advisor' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
  ];

  const investorNav = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/feed', icon: Rss, label: 'Feed' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/my-investments', icon: TrendingUp, label: 'My Investments' },
    { path: '/ai-advisor', icon: Sparkles, label: 'AI Advisor' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
  ];

  const secondaryNav = [
    { path: '/billing', icon: CreditCard, label: 'Billing' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/about', icon: FileText, label: 'About Us' },
    { path: '/help', icon: Shield, label: 'Support' },
  ];

  const adminNav = [
    { path: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/startups', icon: Rocket, label: 'Startups' },
    { path: '/admin/investments', icon: TrendingUp, label: 'Investments' },
    { path: '/admin/reports', icon: FileText, label: 'Reports' },
    { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'founder' ? founderNav : investorNav;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      style={{
        width: collapsed ? '80px' : '260px',
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0.75rem',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 1100,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Logo Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: '2.5rem', paddingLeft: collapsed ? 0 : '0.5rem' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)',
              }}
            >
              <TrendingUp size={24} color="white" strokeWidth={3} />
            </div>
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 900, fontSize: '1.3rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                P.I.E
              </motion.span>
            )}
          </div>
        </Link>
        
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="btn-ghost"
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '10px', minWidth: 0, background: 'var(--bg-tertiary)' }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="btn-ghost"
          style={{ marginBottom: '1.5rem', justifyContent: 'center', padding: '0.75rem', borderRadius: '12px', background: 'var(--bg-tertiary)' }}
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Main Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          {!collapsed && <div className="section-label" style={{ paddingLeft: '1rem', marginBottom: '0.75rem' }}>MAIN MENU</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              const plan = user?.subscriptionPlan || 'free';
              const isLocked = false;

              return (
                <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                  <div
                    className={`nav-item ${active ? 'active' : ''}`}
                    style={{
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      position: 'relative',
                      padding: collapsed ? '0.75rem' : '0.875rem 1rem',
                      height: '48px',
                      borderRadius: '12px',
                      opacity: isLocked ? 0.6 : 1,
                      overflow: 'hidden'
                    }}
                    title={collapsed ? item.label : ''}
                  >
                    {active && (
                      <motion.div 
                        layoutId="active-pill"
                        style={{ position: 'absolute', inset: 0, background: 'rgba(99, 102, 241, 0.1)', zIndex: -1 }}
                      />
                    )}
                    {active && (
                      <motion.div 
                        layoutId="active-indicator"
                        style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: '#6366f1', borderRadius: '0 4px 4px 0' }}
                      />
                    )}
                    <item.icon size={20} strokeWidth={active ? 2.5 : 2} style={{ color: active ? 'var(--brand-500)' : 'inherit' }} />
                    {!collapsed && (
                      <span style={{ fontSize: '0.925rem', fontWeight: active ? 700 : 500, width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.label}
                        {isLocked && <Lock size={12} style={{ marginLeft: 'auto', color: 'var(--accent-amber)' }} />}
                        {item.path === '/dashboard' && !isLocked && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />}
                      </span>
                    )}
                    {!isLocked && item.badge > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: collapsed ? '6px' : '50%',
                          right: collapsed ? '6px' : '12px',
                          transform: collapsed ? 'none' : 'translateY(-50%)',
                          background: 'var(--accent-rose)',
                          color: 'white',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '999px',
                          boxShadow: '0 4px 10px rgba(244, 63, 94, 0.3)',
                        }}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {user?.role !== 'admin' && (
          <div>
            {!collapsed && <div className="section-label" style={{ paddingLeft: '1rem', marginBottom: '0.75rem' }}>SYSTEM</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {secondaryNav.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                    <div
                      className={`nav-item ${active ? 'active' : ''}`}
                      style={{
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '0.75rem' : '0.8rem 1rem',
                        height: '44px',
                        borderRadius: '10px',
                      }}
                      title={collapsed ? item.label : ''}
                    >
                      <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
                      {!collapsed && <span style={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500 }}>{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ color: 'var(--accent-rose)', justifyContent: collapsed ? 'center' : 'flex-start', height: '44px', borderRadius: '10px' }}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut size={18} strokeWidth={2.5} />
          {!collapsed && <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
