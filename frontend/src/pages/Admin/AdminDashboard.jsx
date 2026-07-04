import React, { useState, useEffect } from 'react';
import PieLoader from '../../components/common/PieLoader';
import { Link } from 'react-router-dom';
import { 
  Users, Rocket, FileText, TrendingUp, AlertTriangle, Activity, 
  BarChart3, ArrowUpRight, UserPlus, ShieldAlert, CheckCircle2,
  ExternalLink, Calendar, PlusCircle, MoreVertical, Search,
  Bell, Settings, Filter, Check, X, DollarSign,
  ChevronRight, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api.get('/admin/stats').then(({ data }) => { 
      setStats(data); 
      setLoading(false); 
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApproveStartup = async (id) => {
    try {
      await api.put(`/admin/startups/${id}/approve`);
      fetchStats();
      toast.success('Startup approved');
    } catch (e) { console.error(e); }
  };

  const handleApproveInvestment = async (userId, invId) => {
    try {
      await api.put(`/admin/investments/${userId}/${invId}/approve`);
      fetchStats();
      toast.success('Investment verified');
    } catch (e) { console.error(e); }
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#6366f1', trend: '+12%', sub: 'Community size' },
    { label: 'Verified Startups', value: stats.totalStartups, icon: Rocket, color: '#8b5cf6', trend: '+5%', sub: 'Active projects' },
    { label: 'Track Record', value: stats.totalInvestments, icon: TrendingUp, color: '#10b981', trend: '+15%', sub: 'Verified deals' },
    { label: 'Platform Profit', value: `₹${(stats.totalProfit || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981', trend: 'Live', sub: 'Realized revenue' },
  ] : [];

  const growthData = stats?.monthlyGrowth?.map(m => ({ 
    month: new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'short' }), 
    users: m.count 
  })) || [];

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <PieLoader />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Premium Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6366f1', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            <Zap size={14} fill="#6366f1" /> Operational Intelligence
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Welcome back, Admin
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Here's what's happening on the platform today.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ padding: '1rem 1.5rem', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>SYSTEM STATUS</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                Operational
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem' }}>
        {statCards.map((c, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="card" 
            style={{ 
              padding: '1.75rem', 
              borderRadius: '28px',
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden',
              background: 'var(--bg-card)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <c.icon size={24} color={c.color} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: i === 3 ? '#10b981' : '#10b981', background: i === 3 ? '#10b98115' : '#10b98115', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                  {c.trend}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
              {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{c.sub}</div>
            
            {/* Background Accent */}
            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.03 }}>
              <c.icon size={120} color={c.color} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Growth Chart Section */}
        <div className="card" style={{ padding: '2rem', borderRadius: '32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>Growth Trajectory</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Monthly user acquisition and retention metrics.</p>
            </div>
            <select style={{ padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          
          <div style={{ flex: 1, width: '100%', minHeight: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} dy={15} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px' }}
                  itemStyle={{ fontWeight: 800, color: '#6366f1' }}
                  labelStyle={{ fontWeight: 900, marginBottom: '4px', color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Hub */}
        <div className="card" style={{ padding: '2rem', borderRadius: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '2rem', color: 'var(--text-primary)' }}>Command Center</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'User Directory', icon: Users, color: '#6366f1', link: '/admin/users' },
              { label: 'Startup Queue', icon: Rocket, color: '#10b981', link: '/admin/startups', badge: stats?.pendingStartups },
              { label: 'Investment Verification', icon: TrendingUp, color: '#8b5cf6', link: '/admin/investments', badge: stats?.pendingInvestments },
              { label: 'Safety Reports', icon: ShieldAlert, color: '#f43f5e', link: '/admin/reports', badge: stats?.pendingReports },
              { label: 'Financial Ledger', icon: DollarSign, color: '#0ea5e9', link: '/admin/payments' },
            ].map((a, i) => (
              <Link key={i} to={a.link} style={{ textDecoration: 'none' }}>
                <div 
                  className="nav-item" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '1.25rem', 
                    borderRadius: '20px', 
                    background: 'var(--bg-secondary)',
                    transition: 'all 0.2s',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <a.icon size={20} color={a.color} />
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{a.label}</span>
                  </div>
                  {a.badge > 0 ? (
                    <span style={{ background: a.color, color: 'white', fontSize: '0.75rem', fontWeight: 900, padding: '0.25rem 0.6rem', borderRadius: '8px', boxShadow: `0 4px 10px ${a.color}44` }}>{a.badge}</span>
                  ) : <ChevronRight size={18} color="var(--text-muted)" />}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Operations Queues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: '1.5rem' }}>
        {/* Startup Queue */}
        <div className="card" style={{ padding: '2rem', borderRadius: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Rocket size={22} color="#8b5cf6" /> New Submissions
            </h3>
            <Link to="/admin/startups" style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Review Queue <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats?.recentStartups?.filter(s => !s.isApproved && !s.isRejected).slice(0, 3).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', fontWeight: 900, color: '#8b5cf6' }}>
                    {s.title[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>By {s.founder?.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleApproveStartup(s._id)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} />
                  </button>
                  <button onClick={() => window.location.href = '/admin/startups'} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
            ))}
            {(!stats?.recentStartups || stats.recentStartups.filter(s => !s.isApproved && !s.isRejected).length === 0) && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '20px' }}>
                <CheckCircle2 size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <div style={{ fontWeight: 700 }}>Queue is clear!</div>
              </div>
            )}
          </div>
        </div>

        {/* Investment Queue */}
        <div className="card" style={{ padding: '2rem', borderRadius: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <TrendingUp size={22} color="#10b981" /> Deal Verification
            </h3>
            <Link to="/admin/investments" style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Verify All <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats?.recentInvestments?.filter(inv => inv.investment?.status === 'pending').slice(0, 3).map((inv, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={inv.avatar ? `${inv.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.name)}&background=10b981&color=fff`} style={{ width: '48px', height: '48px', borderRadius: '14px', border: '1px solid var(--border)' }} alt="" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{inv.investment.companyName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{inv.name} • {inv.investment.amount}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleApproveInvestment(inv._id, inv.investment._id)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} />
                  </button>
                  <button onClick={() => window.location.href = '/admin/investments'} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
            ))}
            {(!stats?.recentInvestments || stats.recentInvestments.filter(inv => inv.investment?.status === 'pending').length === 0) && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '20px' }}>
                <ShieldCheck size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <div style={{ fontWeight: 700 }}>Portfolio verified!</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .skeleton {
          background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--border) 50%, var(--bg-secondary) 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 1100px) {
          div[style*="gridTemplateColumns: 2fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
