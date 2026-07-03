import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Bell, Sun, Moon, X, Plus, User, Settings, 
  LogOut, ChevronDown, Command, HelpCircle, LayoutDashboard,
  Rocket, TrendingUp, Sparkles, MessageCircle, ChevronRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import useNotificationStore from '../../store/notificationStore';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { unreadCount } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const createMenuRef = useRef(null);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults(null); return; }
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data);
      setSearchOpen(true);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) setCreateMenuOpen(false);
    };
    
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.querySelector('input')?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setUserMenuOpen(false);
    setCreateMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  return (
    <header
      style={{
        height: '80px',
        background: 'var(--glass-bg)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Left Section: Logo & Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flex: 1 }}>

        <div ref={searchRef} style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', 
                color: searchOpen ? 'var(--brand-500)' : 'var(--text-muted)', transition: 'color 0.2s'
              }} 
            />
            <input
              type="text"
              placeholder="Search startups, investors, opportunities..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              style={{ 
                width: '100%', paddingLeft: '3rem', paddingRight: '4rem', height: '48px',
                borderRadius: '16px', fontSize: '0.95rem', fontWeight: 500,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-400)'}
              onMouseLeave={e => !searchOpen && (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
              {!searchQuery ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'var(--bg-card)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, border: '1px solid var(--border)', opacity: 0.8 }}>
                  <Command size={12} /> K
                </div>
              ) : (
                <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}><X size={14} /></button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {searchOpen && (searchQuery.length >= 2 || searchResults) && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
                className="card"
                style={{ 
                  position: 'absolute', top: 'calc(100% + 14px)', left: 0, right: 0, zIndex: 1100, 
                  padding: '1rem', maxHeight: '480px', overflowY: 'auto', border: '1px solid var(--border)',
                  background: 'var(--bg-card)', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', borderRadius: '20px'
                }}
              >
                {searchResults?.users?.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>PEOPLE</div>
                    {searchResults.users.map((u) => (
                      <div key={u._id} onClick={() => { navigate(`/profile/${u._id}`); setSearchOpen(false); }} className="nav-item" style={{ padding: '0.75rem', borderRadius: '12px', gap: '1rem' }}>
                        <img src={u.avatar ? `http://localhost:1110${u.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff`} alt="" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ textTransform: 'capitalize' }}>{u.role}</span>
                            {u.company && <><span>•</span> <span>{u.company}</span></>}
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ opacity: 0.3 }} />
                      </div>
                    ))}
                  </div>
                )}
                {searchResults?.startups?.length > 0 && (
                  <div style={{ marginBottom: searchResults?.investments?.length ? '1.5rem' : 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>STARTUPS</div>
                    {searchResults.startups.map((s) => (
                      <div key={s._id} onClick={() => { navigate(`/startups/${s._id}`); setSearchOpen(false); }} className="nav-item" style={{ padding: '0.75rem', borderRadius: '12px', gap: '1rem' }}>
                        {s.logo ? (
                          <img src={`http://localhost:1110${s.logo}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 900, color: 'white' }}>{s.title[0]}</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.industry} • {s.stage}</div>
                        </div>
                        <ChevronRight size={14} style={{ opacity: 0.3 }} />
                      </div>
                    ))}
                  </div>
                )}
                {searchResults?.investments?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>INVESTMENTS</div>
                    {searchResults.investments.map((inv) => (
                      <div key={inv._id} onClick={() => { navigate(`/profile/${inv.investorId}`); setSearchOpen(false); }} className="nav-item" style={{ padding: '0.75rem', borderRadius: '12px', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900, border: '1px solid rgba(16,185,129,0.2)' }}>
                          {inv.companyName[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{inv.companyName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.sector} • {inv.round}</div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Investor</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 800 }}>{inv.investorName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(!searchResults?.users?.length && !searchResults?.startups?.length && !searchResults?.investments?.length && searchQuery.length >= 2) && (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}><Search size={24} color="var(--text-muted)" /></div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>No results for "{searchQuery}"</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try refining your keywords or searching by industry.</div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Section: Controls & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={toggleTheme} className="btn-ghost" style={{ width: '44px', height: '44px', borderRadius: '14px' }}>
            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
          </button>

          {user?.role !== 'admin' && (
            <Link to="/notifications" style={{ position: 'relative' }}>
              <button className="btn-ghost" style={{ width: '44px', height: '44px', borderRadius: '14px' }}>
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', width: '10px', height: '10px', background: '#f43f5e', borderRadius: '50%', border: '2px solid var(--bg-card)' }} />
                )}
              </button>
            </Link>
          )}
        </div>

        {user?.role !== 'admin' && <div style={{ width: '1px', height: '32px', background: 'var(--border)', margin: '0 0.5rem' }} />}

        {user?.role !== 'admin' && (
          <div ref={createMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setCreateMenuOpen(!createMenuOpen)}
              className="btn-primary"
              style={{ height: '48px', padding: '0 1.5rem', borderRadius: '14px', gap: '0.75rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.25)', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <Plus size={22} strokeWidth={3} />
              <span>Create</span>
            </button>
            
            <AnimatePresence>
              {createMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  className="card"
                  style={{ position: 'absolute', top: 'calc(100% + 14px)', right: 0, width: '240px', zIndex: 1100, padding: '0.75rem', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: '20px' }}
                >
                  {user?.role === 'founder' && (
                    <Link to="/startups/create" style={{ textDecoration: 'none' }}>
                      <button className="nav-item" style={{ gap: '1rem', padding: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Rocket size={18} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>New Startup</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pitch your vision</div>
                        </div>
                      </button>
                    </Link>
                  )}

                  <Link to="/feed" style={{ textDecoration: 'none' }}>
                    <button className="nav-item" style={{ gap: '1rem', padding: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={18} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Post Update</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Share progress</div>
                      </div>
                    </button>
                  </Link>

                  {user?.role === 'investor' && (
                    <Link to="/my-investments" style={{ textDecoration: 'none' }}>
                      <button className="nav-item" style={{ gap: '1rem', padding: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrendingUp size={18} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>New Investment</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Update portfolio</div>
                        </div>
                      </button>
                    </Link>
                  )}

                  <div style={{ margin: '0.5rem 0', height: '1px', background: 'var(--border-subtle)' }} />
                  
                  <Link to="/ai-analysis" style={{ textDecoration: 'none' }}>
                    <button className="nav-item" style={{ gap: '1rem', padding: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={18} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>AI Insight</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Analyze business</div>
                      </div>
                    </button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem', 
              borderRadius: '16px', border: userMenuOpen ? '1px solid var(--brand-500)' : '1px solid var(--border)', 
              background: userMenuOpen ? 'var(--bg-secondary)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' 
            }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={user?.avatar ? `http://localhost:1110${user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff`}
                alt="" style={{ width: '38px', height: '38px', borderRadius: '12px', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '2px solid var(--bg-card)' }} />
            </div>
            {!userMenuOpen ? <ChevronDown size={18} color="var(--text-muted)" /> : <X size={18} color="var(--brand-500)" />}
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.95 }}
                className="card"
                style={{ position: 'absolute', top: 'calc(100% + 14px)', right: 0, width: '280px', zIndex: 1100, padding: '1rem', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: '24px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', marginBottom: '1rem' }}>
                  <img src={user?.avatar ? `http://localhost:1110${user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff`} alt="" style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{user?.role}</span>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }} />
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand-500)' }}>{user?.subscriptionPlan?.toUpperCase() || 'FREE'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px', padding: '0.875rem', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Monthly Quota</span>
                    <span style={{ color: 'var(--text-primary)' }}>{user?.usageStats?.connectionsMonth?.count || 0} / 50</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(((user?.usageStats?.connectionsMonth?.count || 0) / 50) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '10px' }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <Link to={`/profile/${user?._id}`} style={{ textDecoration: 'none' }}><button className="nav-item" style={{ padding: '0.75rem' }}><User size={18} /><span>My Profile</span></button></Link>
                  <Link to="/dashboard" style={{ textDecoration: 'none' }}><button className="nav-item" style={{ padding: '0.75rem' }}><LayoutDashboard size={18} /><span>Dashboard</span></button></Link>
                  <Link to="/messages" style={{ textDecoration: 'none' }}><button className="nav-item" style={{ padding: '0.75rem' }}><MessageCircle size={18} /><span>Messages</span></button></Link>
                  <Link to="/settings" style={{ textDecoration: 'none' }}><button className="nav-item" style={{ padding: '0.75rem' }}><Settings size={18} /><span>Settings</span></button></Link>
                </div>
                
                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.75rem 0' }} />
                
                <button onClick={handleLogout} className="nav-item" style={{ color: '#f43f5e', padding: '0.75rem' }}><LogOut size={18} /><span>Sign Out</span></button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
