import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Search, UserPlus, Clock, Check, Sparkles, Cpu, HeartPulse, Truck, Layout, ShoppingBag, Leaf, Home, GraduationCap, Globe, Zap, ChevronRight, MapPin, BarChart3, Building2, ArrowRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const categories = [
  { name: "All", icon: <Globe size={15} />, color: "#6366f1", gradient: "linear-gradient(135deg,#6366f1,#818cf8)" },
  { name: "AI", icon: <Cpu size={15} />, color: "#8b5cf6", gradient: "linear-gradient(135deg,#8b5cf6,#a78bfa)" },
  { name: "Fintech", icon: <Zap size={15} />, color: "#f59e0b", gradient: "linear-gradient(135deg,#f59e0b,#fbbf24)" },
  { name: "HealthTech", icon: <HeartPulse size={15} />, color: "#ef4444", gradient: "linear-gradient(135deg,#ef4444,#f87171)" },
  { name: "Logistics", icon: <Truck size={15} />, color: "#3b82f6", gradient: "linear-gradient(135deg,#3b82f6,#60a5fa)" },
  { name: "SaaS", icon: <Layout size={15} />, color: "#06b6d4", gradient: "linear-gradient(135deg,#06b6d4,#22d3ee)" },
  { name: "Ecommerce", icon: <ShoppingBag size={15} />, color: "#ec4899", gradient: "linear-gradient(135deg,#ec4899,#f472b6)" },
  { name: "CleanTech", icon: <Leaf size={15} />, color: "#10b981", gradient: "linear-gradient(135deg,#10b981,#34d399)" },
  { name: "PropTech", icon: <Home size={15} />, color: "#f97316", gradient: "linear-gradient(135deg,#f97316,#fb923c)" },
  { name: "EdTech", icon: <GraduationCap size={15} />, color: "#84cc16", gradient: "linear-gradient(135deg,#84cc16,#a3e635)" },
];

const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }, exit: { opacity: 0, y: -20 } };

const Explore = () => {
  const { user: me, fetchMe } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState(null);
  const [people, setPeople] = useState([]);
  const [startups, setStartups] = useState([]);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [tab, setTab] = useState('ai-match');
  const [matches, setMatches] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sRes = await api.get(`/startups?q=${searchQuery}&category=${category === 'All' ? '' : category}&limit=50`);
      setStartups(sRes.data.startups);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const roleToFind = tab === 'investors' ? 'investor' : '';
      const { data } = await api.get(`/auth/search-users?q=${searchQuery}&role=${roleToFind}&category=${category}`);
      setPeople(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMatches = async () => {
    // Check plan first to avoid unnecessary 403s
    const plan = me?.subscriptionPlan || 'free';
    /* 
    if (plan === 'free' || plan === 'plus') {
      setMatchingLoading(false);
      setLoading(false);
      return;
    }
    */

    setMatchingLoading(true);
    try {
      const { data } = await api.get('/ai/matches');
      setMatches(data);
    } catch (err) {
      console.error('Match error:', err);
      if (err.response?.status !== 403) {
        toast.error('Failed to load AI matches');
      }
    } finally {
      setMatchingLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'ai-match') fetchMatches();
    else if (tab === 'investors') fetchUsers();
    else fetchData();
  }, [searchQuery, tab, category]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleConnect = async (userId) => {
    setConnectingId(userId);
    try {
      await api.post(`/auth/connect/${userId}`);
      await fetchMe(); 
      
      // Update local people/matches state immediately
      setPeople(prev => prev.map(p => {
        if (p._id === userId) {
          return {
            ...p,
            connectionRequests: [...(p.connectionRequests || []), { from: me._id, status: 'pending' }]
          };
        }
        return p;
      }));
      
      setMatches(prev => prev.map(m => {
        if (m._id === userId) {
          return {
            ...m,
            connectionRequests: [...(m.connectionRequests || []), { from: me._id, status: 'pending' }]
          };
        }
        return m;
      }));

      toast.success('Connection request sent!');
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to connect'); 
    } finally {
      setConnectingId(null);
    }
  };

  const activeCategory = useMemo(() => categories.find(c => c.name === category), [category]);

  const getConnectionStatus = (other) => {
    if (!me || !other) return 'none';
    
    // Check if I am following them
    const isFollowing = me.following?.some(f => 
      (typeof f === 'string' ? f : f._id?.toString()) === other._id?.toString()
    );
    
    // Check if they are following me
    const isFollowedBy = me.followers?.some(f => 
      (typeof f === 'string' ? f : f._id?.toString()) === other._id?.toString()
    );
    
    if (isFollowing && isFollowedBy) return 'connected';
    if (isFollowing) return 'following';
    if (isFollowedBy) return 'follow_back';
    
    const hasPendingRequest = other.connectionRequests?.some(r => 
      (r.from?.toString() || r.from?._id?.toString()) === me._id?.toString() && r.status === 'pending'
    );
    if (hasPendingRequest || other.isPending) return 'pending';
    
    return 'none';
  };

  const tabs = [
    { 
      id: 'ai-match', 
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          AI Match 
        </span>
      ), 
      icon: <Sparkles size={16} /> 
    },
    { id: 'startups', label: 'Startups', icon: <span style={{ fontSize: '1rem' }}>🚀</span> },
    { id: 'investors', label: 'Investors', icon: <span style={{ fontSize: '1rem' }}>👥</span> },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: '6rem' }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .hero-mesh {
          position: relative; border-radius: 32px; padding: 4rem; margin-bottom: 3rem; overflow: hidden;
          background: var(--bg-card); border: 1px solid var(--border); box-shadow: 0 24px 64px -12px rgba(99,102,241,0.08);
        }
        .hero-mesh::before {
          content:''; position:absolute; top:-50%; left:-20%; width:100%; height:200%;
          background: radial-gradient(circle at 50% 50%, rgba(99,102,241,0.15) 0%, transparent 50%);
          animation: pulse-mesh 10s ease-in-out infinite alternate; pointer-events:none;
        }
        .hero-mesh::after {
          content:''; position:absolute; bottom:-50%; right:-20%; width:100%; height:200%;
          background: radial-gradient(circle at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 50%);
          animation: pulse-mesh 12s ease-in-out infinite alternate-reverse; pointer-events:none;
        }
        @keyframes pulse-mesh {
          0% { transform: scale(1) translate(0,0); }
          100% { transform: scale(1.1) translate(5%, 5%); }
        }

        .segmented-control {
          display: flex; background: var(--bg-card); padding: 0.35rem; border-radius: 20px;
          border: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }
        .seg-btn {
          position: relative; padding: 0.75rem 1.5rem; font-weight: 700; font-size: 0.9rem; border-radius: 16px;
          border: none; cursor: pointer; color: var(--text-muted); background: transparent; display: flex; align-items: center; gap: 0.5rem;
          transition: color 0.3s ease; z-index: 1; outline: none;
        }
        .seg-btn.active { color: #fff; }
        
        .glass-search {
          background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border); border-radius: 20px; display: flex; align-items: center; gap: 0.75rem;
          padding: 0 1.25rem; transition: all 0.3s ease; height: 52px; box-shadow: 0 4px 24px rgba(0,0,0,0.03);
        }
        .glass-search:focus-within { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
        .glass-search input { background: transparent; border: none; outline: none; font-size: 0.95rem; color: var(--text-primary); width: 100%; font-family: 'Inter', sans-serif; font-weight: 500; }
        .glass-search input::placeholder { color: var(--text-muted); }

        .cat-pill {
          padding: 0.6rem 1.2rem; border-radius: 14px; font-size: 0.85rem; font-weight: 700; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid var(--border); background: var(--bg-card);
          color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; white-space: nowrap;
        }
        .cat-pill:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.04); }
        .cat-pill.active { color: #fff; border-color: transparent; box-shadow: 0 10px 30px rgba(99,102,241,0.25); transform: translateY(-2px); }

        .modern-card {
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 24px; transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative; overflow: hidden; display: flex; flex-direction: column;
        }
        .modern-card::after {
          content: ''; position: absolute; inset: 0; border-radius: 24px; border: 2px solid transparent;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0)) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite: destination-out;
          mask-composite: exclude; opacity: 0.5; pointer-events: none;
        }
        .modern-card:hover { border-color: rgba(99,102,241,0.4); box-shadow: 0 24px 56px rgba(0,0,0,0.08), 0 0 0 1px rgba(99,102,241,0.1) inset; transform: translateY(-6px); }

        .ai-match-row {
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 28px; padding: 2rem;
          display: flex; gap: 2.5rem; transition: all 0.4s ease; position: relative; overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,0.03);
        }
        .ai-match-row:hover { border-color: rgba(99,102,241,0.3); box-shadow: 0 24px 60px rgba(99,102,241,0.08); transform: translateY(-4px); }
        @media (max-width: 900px) { .ai-match-row { flex-direction: column; gap: 1.5rem; padding: 1.5rem; } }

        .score-ring { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .score-ring svg { transform: rotate(-90deg); position: absolute; inset: 0; width: 100%; height: 100%; filter: drop-shadow(0 0 8px rgba(99,102,241,0.4)); }
        .score-ring circle { fill: transparent; stroke-width: 6; stroke-linecap: round; }
        .score-ring .bg { stroke: rgba(99,102,241,0.1); }
        .score-ring .fg { stroke: url(#gradient); transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .score-val { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; }
        .score-val span.num { font-size: 1.75rem; font-weight: 900; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
        .score-val span.lbl { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

        .factor-bar { background: var(--bg-secondary); border-radius: 8px; height: 8px; overflow: hidden; position: relative; }
        .factor-fill { height: 100%; border-radius: 8px; }

        .btn-sleek {
          width: 100%; height: 46px; border-radius: 14px; font-weight: 700; font-size: 0.9rem; border: none; cursor: pointer;
          transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; position: relative; overflow: hidden;
        }
        .btn-sleek.primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 8px 20px rgba(99,102,241,0.25); }
        .btn-sleek.primary:hover { opacity: 0.95; transform: translateY(-2px); box-shadow: 0 12px 28px rgba(99,102,241,0.4); }
        .btn-sleek.done { background: var(--bg-secondary); color: var(--text-muted); cursor: default; }

        .glass-tag {
          background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.7rem; font-weight: 800;
          padding: 0.3rem 0.7rem; border-radius: 8px; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .pill-tag {
          font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 8px;
          background: rgba(99,102,241,0.08); color: #6366f1; border: 1px solid rgba(99,102,241,0.15);
        }
      `}</style>

      {/* Hero Section */}
      <motion.div className="hero-mesh" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '1.5rem', color: '#6366f1', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
            <Compass size={14} /> P.I.E ECOSYSTEM
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '800px' }}>
            Discover the Next <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Unicorn.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            Connect with industry-disrupting startups and elite investors. Leverage our AI to find your perfect partnership.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[['🚀', 'Startups', startups.length || '50+'], ['👥', 'Investors', people.length || '100+'], ['💡', 'Categories', '10']].map(([e, l, v]) => (
              <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{v} <span style={{ fontSize: '1.2rem' }}>{e}</span></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          
          {/* Segmented Tabs */}
          <div className="segmented-control">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`seg-btn ${tab === t.id ? 'active' : ''}`}>
                {tab === t.id && (
                  <motion.div layoutId="activeTab" transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '16px', zIndex: -1, boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
                  />
                )}
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="glass-search" style={{ flex: 1, minWidth: 280, maxWidth: 480 }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input placeholder={`Search ${tabs.find(t=>t.id===tab)?.label}...`} value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            )}
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="no-scrollbar" style={{ overflowX: 'auto', paddingBottom: '1rem', margin: '0 -1rem', padding: '0 1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '0.5rem' }}>
            {categories.map(c => (
              <motion.button key={c.name} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setCategory(c.name)} className={`cat-pill ${category === c.name ? 'active' : ''}`}
                style={category === c.name ? { background: c.gradient } : {}}>
                {c.icon} {c.name}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading || matchingLoading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'grid', gridTemplateColumns: tab === 'ai-match' ? '1fr' : 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.5rem' }}>
            {[...Array(tab === 'ai-match' ? 3 : 6)].map((_, i) => <div key={i} className="skeleton" style={{ height: tab === 'ai-match' ? 220 : 380, borderRadius: 24 }} />)}
          </motion.div>
        ) : (
          <motion.div key={tab + category} variants={stagger} initial="initial" animate="animate" exit="exit">
            <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true" focusable="false">
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </svg>

            {/* AI MATCH LAYOUT */}
            {tab === 'ai-match' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {false ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ 
                      padding: '5rem 2rem', 
                      textAlign: 'center', 
                      background: 'var(--bg-card)', 
                      borderRadius: '32px', 
                      border: '1px solid var(--border)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
                    <div style={{ 
                      width: '80px', height: '80px', borderRadius: '24px', 
                      background: 'rgba(99,102,241,0.1)', color: '#6366f1', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      margin: '0 auto 2rem', border: '1px solid rgba(99,102,241,0.2)' 
                    }}>
                      <Sparkles size={40} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                      Unlock AI-Powered <span style={{ color: '#6366f1' }}>Matching</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
                      Get matched with high-potential {me?.role === 'founder' ? 'investors' : 'startups'} based on your unique profile, industry focus, and growth stage.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                      <Link to="/pricing" style={{ textDecoration: 'none' }}>
                        <button className="btn-sleek primary" style={{ padding: '0 2.5rem', height: '52px' }}>Upgrade to Pro</button>
                      </Link>
                    </div>
                    <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                      {['Smart Scoring', 'Deep Alignment', 'Priority Access'].map(feature => (
                        <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} /> {feature}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {matches.length > 0 && matches.map((match) => {
                  const r = 44, c = 2 * Math.PI * r;
                  const pct = match.matchScore / 100;
                  const status = getConnectionStatus(match);
                  const isConnected = status === 'connected';
                  const isPending = status === 'pending';
                  const isFollowing = status === 'following';
                  const isFollowBack = status === 'follow_back';
                  const isDone = isConnected || isFollowing || isPending;
                  
                  return (
                    <motion.div key={match._id} variants={fadeUp} className="ai-match-row">
                      {match.matchScore >= 80 && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, #6366f1, #a855f7)' }} />
                      )}
                      
                      {/* Left: Profile & Score */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '220px', flexShrink: 0, borderRight: '1px solid var(--border)', paddingRight: '2.5rem' }}>
                        <div className="score-ring">
                          <svg viewBox="0 0 100 100">
                            <circle className="bg" cx="50" cy="50" r={r} />
                            <circle className="fg" cx="50" cy="50" r={r} strokeDasharray={c} strokeDashoffset={c - pct * c} />
                          </svg>
                          <div className="score-val">
                            <span className="num">{match.matchScore}<span style={{ fontSize:'1rem' }}>%</span></span>
                            <span className="lbl">Match</span>
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          <img src={match.avatar ? `http://localhost:5000${match.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name)}&background=6366f1&color=fff&size=80`}
                            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.75rem', border: '3px solid var(--bg-card)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} alt="" />
                          <h3 style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: '0.2rem' }}>{match.name}</h3>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {me?.role === 'founder' ? (match.company || 'Venture Partner') : (match.startup?.title || 'Serial Entrepreneur')}
                          </div>
                        </div>
                      </div>

                      {/* Right: Details & Factors */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                          <div>
                            {match.matchScore >= 80 && <span className="pill-tag" style={{ display: 'inline-block', marginBottom: '0.75rem' }}>✨ {match.matchTag || 'Top Recommendation'}</span>}
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '600px' }}>
                              {me?.role === 'founder' 
                                ? `Based on their investment history and your startup's stage, ${match.name} shows strong alignment with your vision.`
                                : `This startup aligns perfectly with your investment thesis, focusing on similar sectors and growth stages.`}
                            </p>
                          </div>
                        </div>

                        {/* Match Factors */}
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                          {match.matchFactors.slice(0, 3).map((f, i) => {
                             const fpct = (f.score/f.max)*100;
                             return (
                               <div key={i}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                                   <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{f.label}</span>
                                   <span style={{ color: fpct > 50 ? '#10b981' : 'var(--text-muted)', fontWeight: 800 }}>{f.score}/{f.max}</span>
                                 </div>
                                 <div className="factor-bar">
                                   <motion.div initial={{ width: 0 }} animate={{ width: `${fpct}%` }} transition={{ duration: 1, delay: i*0.1 }}
                                     className="factor-fill" style={{ background: fpct > 50 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
                                 </div>
                               </div>
                             );
                          })}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                          <Link to={me?.role === 'founder' ? `/profile/${match._id}` : `/startups/${match.startup?._id}`} style={{ flex: 1, textDecoration: 'none' }}>
                            <button className="btn-sleek" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                              View Profile
                            </button>
                          </Link>
                          <button 
                            onClick={() => !isDone && handleConnect(match._id)} 
                            disabled={isDone || connectingId === match._id}
                            className={`btn-sleek ${isDone ? 'done' : 'primary'}`} 
                            style={{ 
                              flex: 1,
                              ...(isConnected && { color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' })
                            }}
                          >
                             {connectingId === match._id ? 'Connecting...' : 
                              isConnected ? <><Check size={16} /> Connected</> : 
                              isFollowing ? <><Check size={16} /> Following</> :
                              isFollowBack ? <><UserPlus size={16} /> Follow Back</> :
                              isPending ? <><Clock size={16} /> Requested</> : 
                              <><UserPlus size={16} /> Connect</>}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                    {!matchingLoading && matches.length === 0 && (
                      <EmptyState text={me?.role === 'founder' ? "No investors found for your startup profile yet." : "No startups found that match your investment criteria yet."} />
                    )}
                  </>
                )}
              </div>
            )}

            {/* INVESTORS / FOUNDERS LAYOUT */}
            {tab === 'investors' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.5rem' }}>
                {people.map((p) => {
                  const status = getConnectionStatus(p);
                  const isConnected = status === 'connected';
                  const isPending = status === 'pending';
                  const isFollowing = status === 'following';
                  const isFollowBack = status === 'follow_back';
                  const isDone = isConnected || isFollowing || isPending;
                  
                  return (
                    <motion.div key={p._id} variants={fadeUp} className="modern-card">
                      <div style={{ height: 80, background: `linear-gradient(180deg, ${activeCategory?.color || '#6366f1'}15, transparent)`, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: '0.5rem' }}>
                          {p.isVerified && <span className="pill-tag" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }}>✓ Verified</span>}
                          <span className="pill-tag" style={{ textTransform: 'capitalize' }}>{p.role}</span>
                        </div>
                      </div>

                      <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ marginTop: -40, marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <img src={p.avatar ? `http://localhost:5000${p.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=6366f1&color=fff&size=80`}
                            style={{ width: 72, height: 72, borderRadius: '20px', border: '4px solid var(--bg-card)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)', objectFit: 'cover' }} alt="" />
                        </div>

                        <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.25rem' }}>{p.name}</h3>
                        {p.company && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                            <Building2 size={14} /> {p.company}
                          </div>
                        )}
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.bio || 'Building the future. Open to networking and new opportunities in the tech ecosystem.'}
                        </p>

                        {/* Investment Focus Tags */}
                        {p.investmentFocus?.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                            {p.investmentFocus.slice(0, 3).map((tag, idx) => (
                              <span key={idx} style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: 'rgba(99,102,241,0.06)', color: 'var(--brand-500)', border: '1px solid rgba(99,102,241,0.1)' }}>
                                {tag}
                              </span>
                            ))}
                            {p.investmentFocus.length > 3 && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px' }}>+{p.investmentFocus.length - 3} more</span>}
                          </div>
                        )}

                        {/* Track Record Mini Stats (If connected or has data) */}
                        {p.pastInvestments?.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                            <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Track Record</div>
                              <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{p.pastInvestments.length} Deals</div>
                            </div>
                            <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
                            <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Verified</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>{p.pastInvestments.filter(i => i.status === 'accepted').length}</div>
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                          <Link to={`/profile/${p._id}`} style={{ flex: 1, textDecoration: 'none' }}>
                            <button className="btn-sleek" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Profile</button>
                          </Link>
                          <button className={`btn-sleek ${isDone ? 'done' : 'primary'}`} style={{ 
                            flex: 1,
                            ...(isConnected && { color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' })
                          }}
                            onClick={() => !isDone && handleConnect(p._id)} 
                            disabled={isDone || connectingId === p._id}>
                            {connectingId === p._id ? '...' : 
                             isConnected ? <><Check size={16} /> Connected</> : 
                             isFollowing ? <><Check size={16} /> Following</> :
                             isFollowBack ? <><UserPlus size={16} /> Follow Back</> :
                             isPending ? <><Clock size={16} /> Pending</> : 
                             'Connect'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {!loading && people.length === 0 && <EmptyState text="No investors found matching criteria." />}
              </div>
            )}

            {/* STARTUPS LAYOUT */}
            {tab === 'startups' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.5rem' }}>
                {startups.map(s => (
                  <motion.div key={s._id} variants={fadeUp} className="modern-card">
                    <div style={{ height: 160, position: 'relative', background: s.images?.length > 0 ? `url(http://localhost:5000${s.images[0]}) center/cover` : `linear-gradient(135deg, ${activeCategory?.color || '#6366f1'}, #8b5cf6)` }}>
                      {/* Fallback pattern if no specific cover */}
                      {(!s.images || s.images.length === 0) && <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />}
                      
                      <div style={{ position: 'absolute', top: 16, right: 16 }}>
                        <span className="glass-tag">{s.industry?.toUpperCase()}</span>
                      </div>
                      
                      <div style={{ position: 'absolute', bottom: -24, left: 24, padding: 4, background: 'var(--bg-card)', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                        {s.logo ? (
                          <img src={`http://localhost:5000${s.logo}`} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', display: 'block' }} alt="" />
                        ) : (
                          <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.5rem' }}>{s.title?.[0]}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '3rem 1.5rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontWeight: 900, fontSize: '1.25rem' }}>{s.title}</h3>
                        <span className="pill-tag">{s.stage}</span>
                      </div>
                      
                      {s.location ? (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.location)}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600, textDecoration: 'none' }} title="Open in Google Maps">
                          <MapPin size={14} /> {s.location}
                        </a>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>
                          <MapPin size={14} /> Global Ecosystem
                        </div>
                      )}
                      
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6, marginBottom: '1.5rem', flex: 1 }}>
                        {s.tagline || s.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          <BarChart3 size={14} color="#6366f1" /> {s.views || 0} views
                        </div>
                        <Link to={`/startups/${s._id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none' }}>
                          Explore <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {!loading && startups.length === 0 && <EmptyState text={`No startups found in ${category}.`} />}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EmptyState = ({ text }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-card)', borderRadius: 32, border: '1px dashed var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
    <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}>🔍</div>
    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{text}</h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>Try adjusting your filters or search term to discover more opportunities.</p>
  </motion.div>
);

export default Explore;
