import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, LogIn, Sparkles } from 'lucide-react';

const AuthGateModal = ({ isOpen, onClose, type = 'startup' }) => {
  if (!isOpen) return null;
  const label = type === 'startup' ? 'startup' : 'investor';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 24, padding: '2.5rem 2rem', maxWidth: 440, width: '100%', position: 'relative', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
          >
            <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Sparkles size={26} color="white" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>
                Unlock Full {label === 'startup' ? 'Startup' : 'Investor'} Profile
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Join P.I.E to view detailed {label} information, connect, message, and discover investment opportunities.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.85rem' }}>
                  <Rocket size={16} /> Create Free Account
                </button>
              </Link>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.85rem' }}>
                  <LogIn size={16} /> Sign In to Continue
                </button>
              </Link>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
              Free forever · No credit card required
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthGateModal;
