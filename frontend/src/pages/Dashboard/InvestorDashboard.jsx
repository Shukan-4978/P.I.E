import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Eye, IndianRupee, MessageCircle, Activity, ArrowRight, Zap, ShieldCheck, TrendingUp, Search, PlusCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const mockByIndustry = [
  { name: 'SaaS', value: 34, color: '#8b5cf6' },
  { name: 'FinTech', value: 22, color: '#6366f1' },
  { name: 'HealthTech', value: 18, color: '#10b981' },
  { name: 'AI/ML', value: 15, color: '#06b6d4' },
  { name: 'Other', value: 11, color: '#ec4899' },
];

const mockStageData = [
  { stage: 'Idea', count: 12 }, { stage: 'MVP', count: 28 }, { stage: 'Pre-Seed', count: 35 },
  { stage: 'Seed', count: 19 }, { stage: 'Series A', count: 6 },
];

const AnimatedCounter = ({ from = 0, to, duration = 2 }) => {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    const controls = animate(count, to, { duration, ease: "easeOut" });
    return controls.stop;
  }, [count, to, duration]);

  return <motion.span>{rounded}</motion.span>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', color: 'white' }}>
        <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.payload?.color || p.color || '#6366f1' }} />
            <span style={{ textTransform: 'capitalize', color: 'rgba(255,255,255,0.8)' }}>{p.name}:</span>
            <span style={{ color: p.payload?.color || p.color || '#6366f1' }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const QuotaProgress = ({ label, used, limit, color }) => {
  const percentage = limit === 0 ? 0 : Math.min(100, (used / limit) * 100);
  const isInfinite = limit === Infinity || limit === -1 || (typeof limit === 'number' && limit > 1000);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 700 }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: 'var(--text-primary)' }}>
          {isInfinite ? 'Unlimited' : `${used} / ${limit}`}
        </span>
      </div>
      <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {!isInfinite && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ height: '100%', background: color, borderRadius: '4px', boxShadow: `0 0 10px ${color}40` }} 
          />
        )}
        {isInfinite && (
          <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${color}, #10b981, ${color})`, backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }} />
        )}
      </div>
    </div>
  );
};

const InvestorDashboard = () => {
  const { user } = useAuthStore();
  const [savedStartups, setSavedStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limits, setLimits] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [savedRes, limitsRes] = await Promise.all([
          api.get('/startups/user/bookmarked'),
          api.get('/auth/limits')
        ]);
        setSavedStartups(savedRes.data);
        setLimits(limitsRes.data[user?.subscriptionPlan || 'free']);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [user?.subscriptionPlan]);

  const stats = [
    { label: 'Watchlist', value: savedStartups.length, icon: Bookmark, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Deals Reviewed', value: 47, icon: Eye, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Offers Sent', value: 8, icon: IndianRupee, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Conversations', value: 23, icon: MessageCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      <style>{`
        .glass-panel { background: var(--bg-card); border: 1px solid var(--border); border-radius: 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.03); transition: all 0.3s ease; position: relative; overflow: hidden; }
        .glass-panel:hover { box-shadow: 0 20px 50px rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.2); transform: translateY(-2px); }
        .live-badge { display: flex; alignItems: center; gap: 6px; padding: 4px 10px; borderRadius: 20px; background: rgba(16,185,129,0.1); color: #10b981; fontSize: 0.75rem; fontWeight: 800; letterSpacing: 0.5px; textTransform: uppercase; border: 1px solid rgba(16,185,129,0.2); }
        .pulse-dot { width: 6px; height: 6px; borderRadius: 50%; background: #10b981; box-shadow: 0 0 0 0 rgba(16,185,129,1); animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16,185,129,0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
        
        .hero-banner { position: relative; border-radius: 28px; padding: 2.5rem; overflow: hidden; background: linear-gradient(135deg, rgba(16,185,129,0.05), rgba(99,102,241,0.05)); border: 1px solid rgba(16,185,129,0.15); }
        .hero-banner::before { content:''; position:absolute; top:-50px; right:-50px; width:300px; height:300px; background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%); border-radius:50%; pointer-events:none; animation: float 6s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(20px); } 100% { transform: translateY(0px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      {/* Premium Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hero-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            <div className="live-badge"><div className="pulse-dot" /> Live Market</div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}><Activity size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Real-time Deal Flow Active</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            Hello, <span style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0]}</span> 💰
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 600 }}>Explore fresh opportunities and track your investments.</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={24} />
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              <AnimatedCounter to={s.value} />
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Market Trends (Industry) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={22} color="#10b981" /> Deal Flow by Industry
          </h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={mockByIndustry} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                  {mockByIndustry.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
            {mockByIndustry.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} /> {item.name}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Subscription & Quota Usage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={22} color="#10b981" /> Subscription & Quota
            </h3>
            <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
              {user?.subscriptionPlan || 'Free'} Plan
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <QuotaProgress 
              label="Connections" 
              used={user?.usageStats?.connectionsMonth?.count || 0} 
              limit={limits?.connections || 5} 
              color="#10b981" 
            />
            <QuotaProgress 
              label="Investments" 
              used={user?.usageStats?.investmentsMonth?.count || 0} 
              limit={limits?.investments || 1} 
              color="#3b82f6" 
            />
            <QuotaProgress 
              label="Messages" 
              used={user?.usageStats?.messagesToday?.count || 0} 
              limit={limits?.messages || 0} 
              color="#6366f1" 
            />
             <QuotaProgress 
              label="AI Analysis" 
              used={user?.usageStats?.aiAnalysisMonth?.count || 0} 
              limit={limits?.ai_analysis || 0} 
              color="#8b5cf6" 
            />
          </div>

          <Link to="/billing" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.05)' }}>
              Upgrade Plan <ArrowRight size={16} />
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Market Stage Distribution */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp size={22} color="#10b981" /> Portfolio Opportunities by Stage
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={mockStageData}>
            <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: 'var(--text-muted)' }} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="count" fill="url(#bg)" radius={[10, 10, 0, 0]}>
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* My Recent Investments Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={22} color="#6366f1" /> My Investment Track Record
          </h3>
          <Link to="/my-investments">
            <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '12px' }}>
              Manage
            </button>
          </Link>
        </div>

        {!user?.pastInvestments || user.pastInvestments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <IndianRupee size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p style={{ fontWeight: 600 }}>No investments added yet.</p>
            <Link to="/my-investments">
              <button className="btn-primary" style={{ marginTop: '1rem' }}>Add Your First Investment</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...user.pastInvestments].reverse().slice(0, 5).map((inv, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '1.2rem', fontWeight: 900, border: '1px solid rgba(99,102,241,0.2)' }}>
                  {inv.companyName?.[0]?.toUpperCase()}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.companyName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>{inv.amount || 'Undisclosed'}</span>
                    <span>•</span>
                    <span>{inv.round}</span>
                    <span>•</span>
                    <span>{inv.year}</span>
                  </div>
                  {inv.status === 'rejected' && inv.rejectionReason && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.2)' }}>
                      <strong>Reason:</strong> {inv.rejectionReason}
                    </div>
                  )}
                </div>

                <div style={{ flexShrink: 0 }}>
                  {inv.status === 'accepted' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle size={14} /> Approved
                    </div>
                  )}
                  {inv.status === 'pending' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(245,158,11,0.2)' }}>
                      <Clock size={14} /> Pending
                    </div>
                  )}
                  {inv.status === 'rejected' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(244,63,94,0.2)' }}>
                      <XCircle size={14} /> Rejected
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InvestorDashboard;
