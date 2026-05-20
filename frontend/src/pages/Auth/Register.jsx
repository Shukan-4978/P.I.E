import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, ArrowRight, Rocket, IndianRupee, Phone, CheckCircle2, X, Shield, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const LEGAL_CONTENT = {
  terms: {
    title: "Terms of Service",
    lastUpdated: "May 15, 2026",
    sections: [
      {
        title: "1. Acceptance of Terms",
        content: "By accessing or using the P.I.E platform, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service."
      },
      {
        title: "2. Eligibility",
        content: "You must be at least 18 years old to use the platform. By using P.I.E, you represent and warrant that you meet this requirement."
      },
      {
        title: "3. User Conduct",
        content: "You agree not to use the platform for any illegal purpose or in any way that could damage, disable, overburden, or impair the service."
      },
      {
        title: "4. Investment Risks",
        content: "Investing in startups involves significant risk. P.I.E does not provide financial advice and is not responsible for any investment decisions made through the platform."
      },
      {
        title: "5. Payments and Fraud Protection",
        content: "To ensure your safety and protect against potential fraud or cheating, all payments must be processed through the P.I.E platform after closing a deal with any user. We can only provide assistance and support for transactions completed within our secure app. If you process payments outside the platform, we cannot help you in case of fraud or other disputes. For large amounts, we strongly recommend selecting the installment option and paying through our platform. Any payment-related support is strictly limited to transactions handled by P.I.E.",
        highlight: true
      }
    ]
  },
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "May 15, 2026",
    sections: [
      {
        title: "1. Information We Collect",
        content: "We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include your name, email address, phone number, and financial information related to investments."
      },
      {
        title: "2. How We Use Information",
        content: "We use the information we collect to provide, maintain, and improve our services, to process transactions, and to communicate with you about updates, security alerts, and support messages."
      },
      {
        title: "3. Sharing of Information",
        content: "We may share information with founders and investors on the platform as necessary to facilitate connections and deals. We do not sell your personal information to third parties."
      },
      {
        title: "4. Security",
        content: "We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction."
      }
    ]
  }
};

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'founder', agreedToTerms: false });
  const [showPw, setShowPw] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState(null); // 'terms' | 'privacy' | null
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const role = params.get('role');
    if (role === 'founder' || role === 'investor') setForm(p => ({ ...p, role }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agreedToTerms) return toast.error('Please agree to the Terms and Conditions');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      const data = await register(form);
      toast.success('Account created! Welcome to P.I.E.');
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
      {/* Left panel - Info */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{ flex: 1.1, display: 'none', background: '#0f172a', position: 'relative', overflow: 'hidden' }} 
        className="auth-left"
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        
        <div style={{ position: 'relative', zIndex: 1, padding: '5% 10%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', marginBottom: '4rem' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)' }}>
                <TrendingUp size={26} color="white" strokeWidth={3} />
              </div>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 900, fontSize: '1.75rem', color: 'white', letterSpacing: '-0.04em' }}>P.I.E</span>
            </Link>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: '3rem', fontWeight: 900, color: 'white', marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            The platform for <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>tomorrow's</span> giants.
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.15rem', lineHeight: 1.6, marginBottom: '3.5rem', fontWeight: 500 }}
          >
            Connect with verified investors, get AI-powered insights, and accelerate your growth in the most trusted ecosystem.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, staggerChildren: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {['850+ Verified Investors', 'AI-Powered Pitch Analysis', 'Secure Deal Discovery'].map((text, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', fontWeight: 600, fontSize: '1.05rem' }}
              >
                <div style={{ color: '#10b981' }}><CheckCircle2 size={20} /></div>
                {text}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Right panel - form */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-primary)', position: 'relative' }}
      >
        <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        
        <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Join P.I.E</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>Where ambitious visions find their power.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Role selector */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem', marginLeft: '4px' }}>I am a...</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[{ value: 'founder', icon: Rocket, label: 'Founder', desc: 'Raising capital' }, { value: 'investor', icon: IndianRupee, label: 'Investor', desc: 'Seeking deals' }].map(r => (
                  <motion.button 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    key={r.value} type="button" onClick={() => setForm(p => ({ ...p, role: r.value }))}
                    style={{ 
                      padding: '1rem 0.75rem', 
                      borderRadius: '16px', 
                      border: '2px solid',
                      borderColor: form.role === r.value ? '#6366f1' : 'var(--border)', 
                      background: form.role === r.value ? 'rgba(99,102,241,0.05)' : 'var(--bg-primary)', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease', 
                      textAlign: 'center',
                      boxShadow: form.role === r.value ? '0 10px 20px -5px rgba(99, 102, 241, 0.15)' : 'none'
                    }}>
                    <r.icon size={22} color={form.role === r.value ? '#6366f1' : 'var(--text-muted)'} style={{ margin: '0 auto 0.6rem' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: form.role === r.value ? '#6366f1' : 'var(--text-primary)', marginBottom: '0.15rem' }}>{r.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{r.desc}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.6rem', marginLeft: '4px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="xyz.." required className="input" style={{ padding: '0.875rem 1rem 0.875rem 2.75rem' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.6rem', marginLeft: '4px' }}>Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" required className="input" style={{ padding: '0.875rem 1rem 0.875rem 2.75rem' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.6rem', marginLeft: '4px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" required className="input" style={{ padding: '0.875rem 1rem 0.875rem 2.75rem' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.6rem', marginLeft: '4px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" required className="input" style={{ padding: '0.875rem 3rem 0.875rem 2.75rem' }} />
                <button type="button" onClick={() => setShowPw(p => !p)} 
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

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.25rem', padding: '0 4px' }}>
              <input 
                type="checkbox" 
                id="terms-checkbox" 
                checked={form.agreedToTerms} 
                onChange={(e) => setForm(p => ({ ...p, agreedToTerms: e.target.checked }))}
                style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#8b5cf6' }} 
              />
              <label htmlFor="terms-checkbox" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, lineHeight: 1.4 }}>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setActiveLegalTab('terms')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#8b5cf6', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}
                >
                  Terms & Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => setActiveLegalTab('privacy')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#8b5cf6', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}
                >
                  Privacy Policy
                </button>.
              </label>
            </div>

            <motion.button 
              whileHover={{ scale: 1.01, boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)' }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              className="btn-primary" 
              disabled={isLoading} 
              style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '0.5rem', fontSize: '1.05rem', fontWeight: 700, background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}
            >
              {isLoading ? 'Creating account...' : <><Rocket size={20} /> Create Account</>}
            </motion.button>
          </form>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '1.5rem', textAlign: 'center', fontWeight: 500 }}>
            By signing up, you agree to our{' '}
            <button
              type="button"
              onClick={() => setActiveLegalTab('terms')}
              style={{ background: 'none', border: 'none', padding: 0, color: '#8b5cf6', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}
            >
              Terms
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => setActiveLegalTab('privacy')}
              style={{ background: 'none', border: 'none', padding: 0, color: '#8b5cf6', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}
            >
              Privacy
            </button>.
          </p>

          <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
            Already have an account? <Link to="/login" style={{ color: '#8b5cf6', fontWeight: 700, textDecoration: 'none', marginLeft: '0.25rem' }}>Sign in</Link>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {activeLegalTab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLegalTab(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(12px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(25, 28, 41, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.15)',
                width: '100%',
                maxWidth: '650px',
                maxHeight: '85vh',
                borderRadius: '28px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                color: 'white',
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: '1.75rem 2rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setActiveLegalTab(null)}
                  style={{
                    position: 'absolute',
                    right: '1.5rem',
                    top: '1.5rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <X size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', color: '#8b5cf6' }}>
                    {activeLegalTab === 'privacy' ? <Shield size={24} /> : <FileText size={24} />}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                      {LEGAL_CONTENT[activeLegalTab].title}
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Last updated: {LEGAL_CONTENT[activeLegalTab].lastUpdated}
                    </p>
                  </div>
                </div>

                {/* Double Tab Switcher */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveLegalTab('terms')}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeLegalTab === 'terms' ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'transparent',
                      color: activeLegalTab === 'terms' ? 'white' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Terms of Service
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLegalTab('privacy')}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeLegalTab === 'privacy' ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'transparent',
                      color: activeLegalTab === 'privacy' ? 'white' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div 
                className="legal-modal-body"
                style={{ 
                  padding: '2rem', 
                  overflowY: 'auto', 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.75rem' 
                }}
              >
                {LEGAL_CONTENT[activeLegalTab].sections.map((section, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: section.highlight ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '18px',
                      border: section.highlight ? '1.5px solid #8b5cf6' : '1px solid rgba(255,255,255,0.04)',
                      position: 'relative',
                    }}
                  >
                    {section.highlight && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: '#8b5cf6',
                          color: 'white',
                          padding: '2px 8px',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          borderBottomLeftRadius: '10px',
                        }}
                      >
                        Crucial Protection
                      </div>
                    )}
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc' }}>
                      <CheckCircle size={16} color="#8b5cf6" /> {section.title}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '0.875rem', margin: 0 }}>
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.15)' }}>
                <button
                  type="button"
                  onClick={() => setActiveLegalTab(null)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(p => ({ ...p, agreedToTerms: true }));
                    setActiveLegalTab(null);
                    toast.success(`Accepted ${LEGAL_CONTENT[activeLegalTab].title}!`);
                  }}
                  style={{
                    flex: 1.5,
                    padding: '0.875rem',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    color: 'white',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                >
                  Accept & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 992px) {
          .auth-left { display: flex !important; }
        }
        .input:focus {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1) !important;
        }
        .legal-modal-body::-webkit-scrollbar {
          width: 6px;
        }
        .legal-modal-body::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 10px;
        }
        .legal-modal-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .legal-modal-body::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>
  );
};

export default Register;

