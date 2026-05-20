import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back!');
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/feed');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Left panel - form */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}
      >
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', marginBottom: '3rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)' }}>
                <TrendingUp size={22} color="white" strokeWidth={3} />
              </div>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>P.I.E</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Welcome Back 👋</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.05rem', lineHeight: 1.5 }}>
              Ready to <span style={{ color: '#8b5cf6', fontWeight: 600 }}>scale</span> your vision? Login to continue.
            </p>
          </motion.div>

          <motion.form 
            onSubmit={handleSubmit} 
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.6rem', marginLeft: '4px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
                  placeholder="you@example.com" 
                  required 
                  className="input" 
                  style={{ padding: '0.875rem 1rem 0.875rem 2.75rem', fontSize: '1rem' }} 
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', padding: '0 4px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Password</label>
                <Link to="#" style={{ color: '#8b5cf6', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Forgot?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPw ? 'text' : 'password'} 
                  value={form.password} 
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} 
                  placeholder="••••••••" 
                  required 
                  className="input" 
                  style={{ padding: '0.875rem 1rem 0.875rem 2.75rem', paddingRight: '3rem', fontSize: '1rem' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPw(p => !p)} 
                  style={{ 
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', 
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem',
                    borderRadius: '8px', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#8b5cf6'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.01, boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)' }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              className="btn-primary" 
              disabled={isLoading} 
              style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 700 }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                  Signing in...
                </div>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </motion.button>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}
          >
            New to P.I.E? <Link to="/register" style={{ color: '#8b5cf6', fontWeight: 700, textDecoration: 'none', marginLeft: '0.25rem' }}>Create an account</Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Right panel - illustration */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{ flex: 1.2, display: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)', position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: '4rem' }} 
        className="auth-right"
      >
        {/* Animated background elements */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ position: 'absolute', top: '10%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'white', filter: 'blur(80px)' }} 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.05, 0.15, 0.05]
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            style={{ position: 'absolute', bottom: '10%', left: '0%', width: '400px', height: '400px', borderRadius: '50%', background: 'white', filter: 'blur(80px)' }} 
          />
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white', maxWidth: '540px' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ marginBottom: '3rem', position: 'relative' }}
          >
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', padding: '1rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 2 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>AI Powered Analysis</span>
            </div>
            <img 
              src="/images/login-illustration.png" 
              alt="Platform Preview" 
              style={{ width: '100%', borderRadius: '24px', boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255,255,255,0.2)' }} 
            />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            Fueling the next generation of giants.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, fontWeight: 500 }}
          >
            Join 5,000+ investors and founders building the future together on the most advanced investment platform.
          </motion.p>
        </div>
      </motion.div>

      <style>{`
        @media (min-width: 992px) {
          .auth-right { display: flex !important; }
        }
        .input:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default Login;

