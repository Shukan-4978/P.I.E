import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Eye, Heart, IndianRupee, ArrowRight, Brain, PlusCircle, BarChart3, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const mockEngagementData = [
  { day: 'Mon', views: 120, likes: 45, messages: 8 },
  { day: 'Tue', views: 180, likes: 67, messages: 12 },
  { day: 'Wed', views: 240, likes: 89, messages: 19 },
  { day: 'Thu', views: 190, likes: 72, messages: 14 },
  { day: 'Fri', views: 310, likes: 110, messages: 28 },
  { day: 'Sat', views: 280, likes: 95, messages: 22 },
  { day: 'Sun', views: 350, likes: 130, messages: 35 },
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
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
            <span style={{ textTransform: 'capitalize', color: 'rgba(255,255,255,0.8)' }}>{p.name}:</span>
            <span style={{ color: p.color }}>{p.value}</span>
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
          <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${color}, #a855f7, ${color})`, backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }} />
        )}
      </div>
    </div>
  );
};

const FounderDashboard = () => {
  const { user } = useAuthStore();
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limits, setLimits] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [startupsRes, limitsRes] = await Promise.all([
          api.get('/startups/my'),
          api.get('/auth/limits')
        ]);
        setStartups(startupsRes.data);
        setLimits(limitsRes.data[user?.subscriptionPlan || 'free']);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [user?.subscriptionPlan]);

  const totalViews = startups.reduce((a, s) => a + (s.views || 0), 0);
  const totalOffers = startups.reduce((a, s) => a + (s.investmentOffers?.length || 0), 0);
  const totalBookmarks = startups.reduce((a, s) => a + (s.bookmarks?.length || 0), 0);

  const stats = [
    { label: 'Total Views', value: totalViews, icon: Eye, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Startups', value: startups.length, icon: Rocket, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Investment Offers', value: totalOffers, icon: IndianRupee, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Bookmarks', value: totalBookmarks, icon: Heart, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      <style>{`
        .glass-panel { background: var(--bg-card); border: 1px solid var(--border); border-radius: 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.03); transition: all 0.3s ease; position: relative; overflow: hidden; }
        .glass-panel:hover { box-shadow: 0 20px 50px rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.2); transform: translateY(-2px); }
        .live-badge { display: flex; alignItems: center; gap: 6px; padding: 4px 10px; borderRadius: 20px; background: rgba(16,185,129,0.1); color: #10b981; fontSize: 0.75rem; fontWeight: 800; letterSpacing: 0.5px; textTransform: uppercase; border: 1px solid rgba(16,185,129,0.2); }
        .pulse-dot { width: 6px; height: 6px; borderRadius: 50%; background: #10b981; box-shadow: 0 0 0 0 rgba(16,185,129,1); animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16,185,129,0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
        
        .hero-banner { position: relative; border-radius: 28px; padding: 2.5rem; overflow: hidden; background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05)); border: 1px solid rgba(99,102,241,0.15); }
        .hero-banner::before { content:''; position:absolute; top:-50px; right:-50px; width:300px; height:300px; background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%); border-radius:50%; pointer-events:none; animation: float 6s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(20px); } 100% { transform: translateY(0px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      {/* Premium Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hero-banner">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div className="live-badge"><div className="pulse-dot" /> Live System</div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}><Activity size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Real-time Sync Active</span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
              Welcome back, <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 600 }}>Here's what's happening with your startups today.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/startups/create" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ padding: '0.85rem 1.5rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800 }}>
                <PlusCircle size={20} /> Create Startup
              </button>
            </Link>
          </div>
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
        {/* Engagement Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BarChart3 size={22} color="#6366f1" /> Growth Metrics
            </h3>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '8px' }}>Last 7 Days</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mockEngagementData}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--text-muted)' }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="views" stroke="#6366f1" fill="url(#gv)" strokeWidth={3} animationDuration={2000} />
              <Area type="monotone" dataKey="likes" stroke="#10b981" fill="url(#gl)" strokeWidth={3} animationDuration={2000} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', fontSize: '0.85rem', fontWeight: 700, justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px rgba(99,102,241,0.5)' }} />Views</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />Likes</span>
          </div>
        </motion.div>

        {/* AI Analysis CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(99,102,241,0.05))', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 12px 32px rgba(168,85,247,0.4)' }}>
            <Brain size={28} color="white" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>AI Pitch Analysis</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem', flex: 1 }}>
            Get real-time investor-grade insights. Upload your deck to receive an instant investment score, market assessment, and actionable feedback.
          </p>
          <Link to="/ai-analysis" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white', border: 'none', fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(168,85,247,0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <Brain size={20} /> Analyze My Pitch <ArrowRight size={18} />
            </button>
          </Link>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Subscription & Quota Usage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity size={22} color="#6366f1" /> Subscription & Quota
            </h3>
            <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
              {user?.subscriptionPlan || 'Free'} Plan
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <QuotaProgress 
              label="Connections" 
              used={user?.usageStats?.connectionsMonth?.count || 0} 
              limit={limits?.connections || 5} 
              color="#6366f1" 
            />
            <QuotaProgress 
              label="Startups" 
              used={user?.usageStats?.startupsMonth?.count || 0} 
              limit={limits?.startups || 1} 
              color="#8b5cf6" 
            />
            <QuotaProgress 
              label="Posts" 
              used={user?.usageStats?.postsMonth?.count || 0} 
              limit={limits?.posts || 2} 
              color="#10b981" 
            />
            <QuotaProgress 
              label="AI Analysis" 
              used={user?.usageStats?.aiAnalysisMonth?.count || 0} 
              limit={limits?.ai_analysis || 0} 
              color="#f59e0b" 
            />
          </div>

          <Link to="/billing" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800, color: '#6366f1', background: 'rgba(99,102,241,0.05)' }}>
              Upgrade Plan <ArrowRight size={16} />
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Startups List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Rocket size={22} color="#6366f1" /> Active Startups
          </h3>
          <Link to="/startups/create"><button className="btn-ghost" style={{ fontSize: '0.9rem', padding: '8px 16px', borderRadius: '12px', background: 'rgba(99,102,241,0.08)' }}><PlusCircle size={18} /> Add New</button></Link>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '16px' }} />)}
          </div>
        ) : startups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
            <Rocket size={40} style={{ margin: '0 auto 1rem', opacity: 0.3, color: '#6366f1' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>No startups yet</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Create your first startup profile to start tracking metrics.</p>
            <Link to="/startups/create"><button className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>Create Startup</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {startups.map(s => (
              <Link key={s._id} to={`/startups/${s._id}`} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem 1.25rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {s.logo ? (
                    <img src={`http://localhost:5000${s.logo}`} alt={`${s.title} logo`} style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--bg-card)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.4rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>{s.title[0]}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.2rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 600 }}>{s.industry} <span style={{ margin: '0 6px', color: 'var(--border)' }}>•</span> {s.stage}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', flexShrink: 0, fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Eye size={16} color="#6366f1" />{s.views}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><IndianRupee size={16} color="#10b981" />{s.investmentOffers?.length || 0}</span>
                  </div>
                  <span style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: s.isApproved ? 'rgba(16,185,129,0.1)' : s.isRejected ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)', color: s.isApproved ? '#10b981' : s.isRejected ? '#f43f5e' : '#f59e0b', border: `1px solid ${s.isApproved ? 'rgba(16,185,129,0.2)' : s.isRejected ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                    {s.isApproved ? 'Live' : s.isRejected ? 'Rejected' : 'Pending'}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FounderDashboard;
