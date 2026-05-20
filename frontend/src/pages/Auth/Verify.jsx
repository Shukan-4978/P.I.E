import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Verify = () => {
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) {
      toast.error('Please login first');
      navigate('/login');
    }
    if (user?.isEmailVerified) {
      setEmailVerified(true);
      navigate('/feed');
    }
  }, [user, token, navigate]);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!emailCode) return toast.error('Enter email verification code');
    setLoading(true);
    try {
      await api.post('/auth/verify/email/confirm', { code: emailCode });
      setEmailVerified(true);
      toast.success('Email verified successfully!');
      
      // Update local state and proceed to feed
      await useAuthStore.getState().fetchMe();
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      await api.post('/auth/verify/email/request');
      toast.success('New code sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend');
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>Account Verification</h1>
          <p style={{ color: 'var(--text-secondary)' }}>We've sent a verification code to your email. Please enter it below to continue.</p>
        </div>



        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Email Verification */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: emailVerified ? '2px solid #10b981' : '1px solid var(--border)', position: 'relative' }}>
            {emailVerified && <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#10b981', borderRadius: '50%', padding: '0.25rem', display: 'flex' }}><CheckCircle size={16} color="white" /></div>}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(139,92,246,0.1)', borderRadius: '10px' }}><Mail size={18} color="#8b5cf6" /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Email Verification</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
            </div>

            {emailVerified ? (
              <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} /> Verified
              </div>
            ) : (
              <form onSubmit={handleVerifyEmail} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={emailCode} 
                  onChange={e => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="6-digit code" 
                  className="input" 
                  style={{ flex: 1, letterSpacing: '2px', fontFamily: 'monospace', fontSize: '1.1rem' }} 
                />
                <button type="submit" disabled={loading || emailCode.length !== 6} className="btn-primary" style={{ background: '#8b5cf6', border: 'none', padding: '0 1.25rem' }}>
                  Verify
                </button>
              </form>
            )}
            {!emailVerified && <button onClick={handleResendEmail} style={{ background: 'none', border: 'none', color: '#8b5cf6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.75rem', padding: 0 }}>Resend Code</button>}
          </div>

        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}>
            Logout & Try Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default Verify;
