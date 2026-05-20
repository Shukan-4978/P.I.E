import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Home, Sun, Moon } from 'lucide-react';
import useThemeStore from '../store/themeStore';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }
});

const NotFound = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:60, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', background:'var(--glass-bg)', borderBottom:'1px solid var(--glass-border)' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingUp size={17} color="white" />
            </div>
            <span style={{ fontFamily:'Plus Jakarta Sans', fontWeight:900, fontSize:'1.15rem', letterSpacing:'-0.02em' }}>P.I.E</span>
          </div>
        </Link>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <button onClick={toggleTheme} className="btn-ghost" style={{ padding:'0.45rem' }}>{isDark ? <Sun size={17}/> : <Moon size={17}/>}</button>
          <Link to="/"><button className="btn-secondary" style={{ padding:'0.5rem 1.25rem' }}>Go Home</button></Link>
        </div>
      </nav>

      {/* 404 CONTENT */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '6rem 5% 4rem' }}>
        {/* bg orbs */}
        <div style={{ position:'absolute', top:'20%', left:'20%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'10%', right:'20%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(236,72,153,0.08) 0%,transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }}/>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <motion.div {...fadeUp(0)}>
            <h1 style={{ fontSize: 'clamp(6rem, 15vw, 10rem)', fontWeight: 900, lineHeight: 1, margin: 0, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing: '-0.05em' }}>
              404
            </h1>
          </motion.div>
          
          <motion.div {...fadeUp(0.1)} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              Page not found
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.2)} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/">
              <button className="btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
                <Home size={18} />
                Back to Home
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
