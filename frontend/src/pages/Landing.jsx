import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/layout/Footer';
import AuthGateModal from '../components/AuthGateModal';
import {
  TrendingUp, Zap, Brain, Users, BarChart3, MessageCircle,
  IndianRupee, Shield, Rocket, ArrowRight, Check, Sun, Moon,
  ChevronRight, Sparkles, Globe, Lock, MapPin, Building2, Eye
} from 'lucide-react';
import useThemeStore from '../store/themeStore';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }
});

const FEATURES = [
  { icon: Brain, label: 'AI Pitch Analysis', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', desc: 'GPT-powered scoring with market sizing & recommendations.' },
  { icon: MessageCircle, label: 'Real-Time Chat', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', desc: 'Instant founder↔investor messaging with offer flows.' },
  { icon: BarChart3, label: 'Analytics Dashboard', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', desc: 'Live engagement metrics for every post and profile.' },
  { icon: Shield, label: 'Verified Profiles', color: '#10b981', bg: 'rgba(16,185,129,0.12)', desc: 'Admin-verified accounts for a trusted ecosystem.' },
  { icon: Globe, label: 'Discovery Feed', color: '#ec4899', bg: 'rgba(236,72,153,0.12)', desc: 'Infinite-scroll feed surfacing the best startups daily.' },
  { icon: IndianRupee, label: 'Investment Offers', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', desc: 'Structured term-sheet flows built into the platform.' },
];

const INITIAL_STATS = [
  { value: '...', label: 'Startups' },
  { value: '...', label: 'Investors' },
  { value: '...', label: 'Raised' },
  { value: '...', label: 'Match Rate' },
];

const PLANS = [
  {
    name: 'PIE Free',
    price: '₹0',
    sub: 'forever',
    color: '#64748b',
    popular: false,
    cta: 'Start Free',
    features: [
      '5 connections/month',
      'Messages Locked (Plus+ only)',
      '2 posts/month',
      '1 startup/investment add/mo',
      'AI Analysis & Advisor Locked',
      'AI Match Locked',
    ],
  },
  {
    name: 'PIE Plus',
    price: '₹51',
    sub: '/month',
    color: '#10b981',
    popular: false,
    cta: 'Upgrade to Plus',
    features: [
      '10 connections/month',
      '10 messages/day',
      '5 AI Analysis/month',
      '5 posts/month',
      '2 startups/investments add/mo',
      'AI Advisor Locked',
      'AI Match Locked',
    ],
  },
  {
    name: 'PIE Pro',
    price: '₹101',
    sub: '/month',
    color: '#6366f1',
    popular: true,
    cta: 'Start Pro',
    features: [
      '20 connections/month',
      '50 messages/day',
      '10 AI Analysis/month',
      '10 AI Advisor messages/mo',
      '10 posts/month',
      '5 startups/investments add/mo',
      'AI Match Unlocked',
      'Verified badge consideration',
    ],
  },
  {
    name: 'PIE Premium',
    price: '₹251',
    sub: '/month',
    color: '#8b5cf6',
    popular: false,
    cta: 'Go Premium',
    features: [
      'Everything Unlimited',
      'Direct Investor Introductions',
      'Priority Support',
      'Custom Analytics',
      'Featured Profile',
    ],
  },
];

const Tag = ({ children }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'999px', padding:'0.35rem 0.9rem', fontSize:'0.78rem', fontWeight:700, color:'#818cf8', marginBottom:'1.25rem' }}>
    {children}
  </span>
);

const INDUSTRY_COLORS = { fintech:'#10b981', healthtech:'#06b6d4', edtech:'#8b5cf6', saas:'#6366f1', ecommerce:'#f59e0b', 'ai-ml':'#ec4899', cleantech:'#22c55e', logistics:'#f97316', 'real-estate':'#a78bfa', other:'#64748b' };

const Landing = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const [tick, setTick] = useState(0);
  const [liveStats, setLiveStats] = useState(INITIAL_STATS);
  const [activeTab, setActiveTab] = useState('startups');
  const [publicStartups, setPublicStartups] = useState([]);
  const [publicInvestors, setPublicInvestors] = useState([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [gateModal, setGateModal] = useState({ open: false, type: 'startup' });

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 60);

    const fmt = (num) => {
      if (!num) return '₹0';
      if (num >= 10000000) return `₹${(num/10000000).toFixed(1).replace('.0','')}Cr`;
      if (num >= 100000) return `₹${(num/100000).toFixed(1).replace('.0','')}L`;
      if (num >= 1000) return `₹${(num/1000).toFixed(1).replace('.0','')}K`;
      return `₹${num}`;
    };

    Promise.all([
      fetch('http://localhost:1110/api/startups/public/stats').then(r => r.json()),
      fetch('http://localhost:1110/api/startups/public/list').then(r => r.json()),
      fetch('http://localhost:1110/api/auth/public/investors').then(r => r.json()),
    ]).then(([stats, startupsData, investorsData]) => {
      const { startups, investors, raised, matchRate } = stats;
      setLiveStats([
        { value: startups.toString(), label: 'Startups' },
        { value: investors.toString(), label: 'Investors' },
        { value: fmt(raised), label: 'Raised' },
        { value: matchRate, label: 'Match Rate' },
      ]);
      setPublicStartups(startupsData.startups || []);
      setPublicInvestors(investorsData.investors || []);
    }).catch(err => console.error('Landing fetch error:', err))
      .finally(() => setLoadingPublic(false));

    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:60, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', background:'var(--glass-bg)', borderBottom:'1px solid var(--glass-border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}>
            <TrendingUp size={20} color="white" strokeWidth={3} />
          </div>
          <span style={{ fontFamily:'Plus Jakarta Sans', fontWeight:900, fontSize:'1.25rem', letterSpacing:'-0.03em' }}>P.I.E</span>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <button onClick={toggleTheme} className="btn-ghost" style={{ padding:'0.45rem' }}>{isDark ? <Sun size={17}/> : <Moon size={17}/>}</button>
          <Link to="/login"><button className="btn-ghost">Sign In</button></Link>
          <Link to="/register"><button className="btn-primary" style={{ padding:'0.5rem 1.25rem' }}>Get Started <ArrowRight size={15}/></button></Link>
        </div>
      </nav>

      {/* HERO — split layout */}
      <section style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', alignItems:'center', padding:'6rem 5% 4rem', gap:'3rem', position:'relative', overflow:'hidden' }}>
        {/* bg orbs */}
        <div style={{ position:'absolute', top:'8%', right:'30%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 65%)', filter:'blur(50px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'5%', right:'5%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }}/>

        {/* LEFT */}
        <div style={{ position:'relative', zIndex:1 }}>
          <motion.div {...fadeUp(0)}>
            <Tag><Sparkles size={12}/> AI-Powered Investment Platform</Tag>
          </motion.div>
          <motion.h1 {...fadeUp(0.08)} style={{ fontSize:'clamp(2.6rem,5vw,4.2rem)', lineHeight:1.05, letterSpacing:'-0.04em', marginBottom:'1.4rem' }}>
            The smartest way<br/>to <span className="gradient-text">raise capital</span><br/>& discover deals.
          </motion.h1>
          <motion.p {...fadeUp(0.16)} style={{ fontSize:'1.05rem', color:'var(--text-secondary)', lineHeight:1.75, maxWidth:480, marginBottom:'2.25rem' }}>
            P.I.E connects visionary founders with strategic investors through AI-powered pitch analysis, real-time discovery, and seamless deal flow — all in one platform.
          </motion.p>
          <motion.div {...fadeUp(0.22)} style={{ display:'flex', gap:'0.875rem', flexWrap:'wrap', marginBottom:'3rem' }}>
            <Link to="/register"><button className="btn-primary" style={{ fontSize:'0.95rem', padding:'0.8rem 1.75rem' }}><Rocket size={16}/> I'm a Founder</button></Link>
            <Link to="/register"><button className="btn-secondary" style={{ fontSize:'0.95rem', padding:'0.8rem 1.75rem' }}><IndianRupee size={16}/> I'm an Investor</button></Link>
          </motion.div>
          {/* trust row */}
          <motion.div {...fadeUp(0.28)} style={{ display:'flex', gap:'0.5rem', alignItems:'center', color:'var(--text-muted)', fontSize:'0.82rem' }}>
            <Lock size={13}/> No credit card required &nbsp;·&nbsp; Setup in 2 minutes
          </motion.div>
        </div>

        {/* RIGHT — bento mini cards */}
        <motion.div initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.7, delay:0.15, ease:[0.22,1,0.36,1] }} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', position:'relative', zIndex:1 }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y:-4, boxShadow:`0 16px 40px ${f.color}25` }}
              style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.5rem', transition:'all 0.25s ease', cursor:'default' }}
            >
              <div style={{ width:42, height:42, borderRadius:12, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'0.875rem' }}>
                <f.icon size={20} color={f.color}/>
              </div>
              <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.35rem' }}>{f.label}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.55 }}>{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* STATS STRIP */}
      <div style={{ borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'2.5rem 5%', background:'var(--bg-secondary)', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', textAlign:'center' }}>
        {liveStats.map((s, i) => (
          <motion.div key={i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.08 }}>
            <div style={{ fontSize:'2.2rem', fontWeight:900, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{s.value}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', fontWeight:500, marginTop:'0.2rem' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* AUTH GATE MODAL */}
      <AuthGateModal isOpen={gateModal.open} onClose={() => setGateModal({ open:false, type:'startup' })} type={gateModal.type} />

      {/* DISCOVER SECTION */}
      <section style={{ padding:'6rem 5%', background:'var(--bg-secondary)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'999px', padding:'0.35rem 0.9rem', fontSize:'0.78rem', fontWeight:700, color:'#818cf8', marginBottom:'1rem' }}>
              <Globe size={12}/> Live on the Platform
            </span>
            <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.5rem)', letterSpacing:'-0.03em', marginBottom:'0.75rem' }}>
              Discover <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Startups & Investors</span>
            </h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.95rem' }}>Browse profiles — click any card to unlock full details.</p>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center', marginBottom:'2rem' }}>
            {['startups','investors'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding:'0.55rem 1.5rem', borderRadius:999, fontWeight:700, fontSize:'0.88rem', cursor:'pointer', border: activeTab===tab ? 'none' : '1px solid var(--border)', background: activeTab===tab ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent', color: activeTab===tab ? 'white' : 'var(--text-secondary)', transition:'all 0.2s' }}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          {loadingPublic ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1rem' }}>
              {[...Array(4)].map((_,i) => (
                <div key={i} style={{ height:180, borderRadius:16, background:'var(--bg-card)', border:'1px solid var(--border)', animation:'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : activeTab === 'startups' ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1rem' }}>
              {publicStartups.length === 0 ? (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>No startups yet — be the first!</div>
              ) : publicStartups.map((s, i) => (
                <motion.div key={s._id||i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.06 }}
                  whileHover={{ y:-4, boxShadow:'0 16px 40px rgba(99,102,241,0.15)' }}
                  onClick={() => setGateModal({ open:true, type:'startup' })}
                  style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.25rem', cursor:'pointer', transition:'all 0.25s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.875rem' }}>
                    {s.logo ? <img src={`http://localhost:1110${s.logo}`} alt={s.title} style={{ width:44, height:44, borderRadius:10, objectFit:'cover', border:'1px solid var(--border)' }} /> : <div style={{ width:44, height:44, borderRadius:10, background:`linear-gradient(135deg,${INDUSTRY_COLORS[s.industry]||'#6366f1'},#8b5cf6)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Building2 size={18} color="white"/></div>}
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:'0.92rem', marginBottom:'0.15rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.title}</div>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, color: INDUSTRY_COLORS[s.industry]||'#6366f1', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.industry}</div>
                    </div>
                  </div>
                  {s.tagline && <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.5, marginBottom:'0.875rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{s.tagline}</p>}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'0.2rem 0.6rem', borderRadius:999, background:'rgba(99,102,241,0.1)', color:'#818cf8' }}>{s.stage}</span>
                    {s.location && <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.2rem' }}><MapPin size={10}/>{s.location}</span>}
                  </div>
                  <div style={{ marginTop:'0.75rem', padding:'0.6rem 0', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'0.35rem', color:'#6366f1', fontSize:'0.78rem', fontWeight:700 }}>
                    <Eye size={13}/> Click to view full profile
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1rem' }}>
              {publicInvestors.length === 0 ? (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>No investors yet.</div>
              ) : publicInvestors.map((inv, i) => (
                <motion.div key={inv._id||i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.06 }}
                  whileHover={{ y:-4, boxShadow:'0 16px 40px rgba(139,92,246,0.15)' }}
                  onClick={() => setGateModal({ open:true, type:'investor' })}
                  style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.25rem', cursor:'pointer', transition:'all 0.25s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.875rem' }}>
                    {inv.avatar ? <img src={`http://localhost:1110${inv.avatar}`} alt={inv.name} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(139,92,246,0.3)' }} /> : <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#8b5cf6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.1rem', color:'white', flexShrink:0 }}>{inv.name?.[0]?.toUpperCase()||'I'}</div>}
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:'0.92rem', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                        {inv.name}
                        {inv.isVerified && <span style={{ fontSize:'0.65rem', background:'rgba(16,185,129,0.15)', color:'#10b981', padding:'0.1rem 0.4rem', borderRadius:999, fontWeight:700 }}>✓</span>}
                      </div>
                      {inv.company && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{inv.company}</div>}
                    </div>
                  </div>
                  {inv.bio && <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.5, marginBottom:'0.875rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{inv.bio}</p>}
                  {inv.investmentFocus?.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem', marginBottom:'0.5rem' }}>
                      {inv.investmentFocus.slice(0,3).map((f,j) => <span key={j} style={{ fontSize:'0.68rem', padding:'0.15rem 0.5rem', borderRadius:999, background:'rgba(139,92,246,0.1)', color:'#a78bfa', fontWeight:600 }}>{f}</span>)}
                    </div>
                  )}
                  <div style={{ marginTop:'0.75rem', padding:'0.6rem 0', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'0.35rem', color:'#8b5cf6', fontSize:'0.78rem', fontWeight:700 }}>
                    <Eye size={13}/> Click to view full profile
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS — horizontal timeline */}
      <section style={{ padding:'7rem 5%', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'4rem' }}>
          <Tag><Zap size={12}/> How It Works</Tag>
          <h2 style={{ fontSize:'clamp(2rem,3.5vw,2.75rem)', letterSpacing:'-0.03em' }}>
            From pitch to funding in <span className="gradient-text">3 steps</span>
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem', position:'relative' }}>
          {/* connector line */}
          <div style={{ position:'absolute', top:52, left:'17%', right:'17%', height:2, background:'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)', opacity:0.3, borderRadius:2 }}/>
          {[
            { n:'01', icon:Users, title:'Build Your Profile', desc:'Founders craft startup profiles with pitch data, team, and funding goals. Investors set deal preferences.' },
            { n:'02', icon:Globe, title:'Discover & Connect', desc:'Browse the curated feed, filter by stage or sector, and message directly or send an investment offer.' },
            { n:'03', icon:Zap, title:'Close Deals Fast', desc:'AI analysis turbocharges due diligence. Real-time comms turn interest into investment in record time.' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:i*0.15 }} style={{ textAlign:'center', padding:'2rem 1.5rem' }}>
              <div style={{ width:60, height:60, borderRadius:18, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem', boxShadow:'0 8px 28px rgba(99,102,241,0.3)', position:'relative', zIndex:1 }}>
                <s.icon size={26} color="white"/>
              </div>
              <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#818cf8', letterSpacing:'0.12em', marginBottom:'0.5rem' }}>STEP {s.n}</div>
              <h3 style={{ fontSize:'1.1rem', marginBottom:'0.65rem' }}>{s.title}</h3>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', lineHeight:1.7 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding:'7rem 5%', background:'var(--bg-secondary)' }}>
        <div style={{ maxWidth:960, margin:'0 auto', textAlign:'center' }}>
          <Tag><IndianRupee size={12}/> Pricing</Tag>
          <h2 style={{ fontSize:'clamp(2rem,3.5vw,2.75rem)', letterSpacing:'-0.03em', marginBottom:'0.75rem' }}>Start free, <span className="gradient-text">scale as you grow</span></h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:'3.5rem', fontSize:'1rem' }}>No hidden fees. Cancel anytime.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', alignItems:'stretch' }}>
            {PLANS.map((plan, i) => (
              <motion.div key={i} initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:i*0.1 }} whileHover={{ y:-5 }}
                style={{ background:'var(--bg-card)', border: plan.popular ? `2px solid ${plan.color}` : '1px solid var(--border)', borderRadius:20, padding:'2rem 1.5rem', position:'relative', display:'flex', flexDirection:'column', boxShadow: plan.popular ? `0 20px 48px ${plan.color}22` : 'none', transform: plan.popular ? 'scale(1.03)' : 'scale(1)', transition:'all 0.25s ease' }}>
                {plan.popular && <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:`linear-gradient(135deg,${plan.color},#8b5cf6)`, color:'white', padding:'0.3rem 1.25rem', borderRadius:999, fontSize:'0.7rem', fontWeight:800, whiteSpace:'nowrap' }}>⭐ Most Popular</div>}
                <div style={{ marginBottom:'1.25rem', textAlign:'center' }}>
                  <h3 style={{ fontSize:'1rem', fontWeight:800, marginBottom:'0.6rem', color: plan.color }}>{plan.name}</h3>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'0.3rem', justifyContent:'center' }}>
                    <span style={{ fontSize:'2.4rem', fontWeight:900, color: plan.popular ? plan.color : 'var(--text-primary)' }}>{plan.price}</span>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{plan.sub}</span>
                  </div>
                </div>
                <ul style={{ listStyle:'none', flex:1, marginBottom:'1.5rem', display:'flex', flexDirection:'column', gap:'0.55rem', textAlign:'left' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display:'flex', alignItems:'flex-start', gap:'0.5rem', fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.45 }}>
                      <Check size={13} color="#10b981" style={{ flexShrink:0, marginTop:2 }}/>{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register"><button className={plan.popular ? 'btn-primary' : 'btn-secondary'} style={{ width:'100%', justifyContent:'center', fontSize:'0.82rem' }}>{plan.cta} <ChevronRight size={14}/></button></Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding:'7rem 5%' }}>
        <motion.div initial={{ opacity:0, scale:0.97 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ duration:0.55 }}
          style={{ maxWidth:820, margin:'0 auto', borderRadius:28, padding:'5rem 3rem', textAlign:'center', background:'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.1),rgba(236,72,153,0.08))', border:'1px solid rgba(99,102,241,0.2)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%)', filter:'blur(30px)' }}/>
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🚀</div>
            <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', letterSpacing:'-0.03em', marginBottom:'1rem' }}>
              Ready to <span className="gradient-text">launch or invest?</span>
            </h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'1.05rem', lineHeight:1.75, marginBottom:'2rem', maxWidth:520, margin:'0 auto 2rem' }}>
              Join thousands of founders and investors already building the future on P.I.E.
            </p>
            <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
              <Link to="/register"><button className="btn-primary" style={{ fontSize:'1rem', padding:'0.85rem 2rem' }}>Start for Free <ArrowRight size={16}/></button></Link>
              <Link to="/login"><button className="btn-secondary" style={{ fontSize:'1rem', padding:'0.85rem 2rem' }}>Sign In</button></Link>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
