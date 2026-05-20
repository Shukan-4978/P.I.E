import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (countdown <= 0) {
      navigate(redirectUrl);
    }
  }, [countdown, navigate, redirectUrl]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      >
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle size={40} color="#10b981" />
        </div>
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1rem' }}>Payment Successful!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          Your payment has been processed securely. You are being redirected back to the platform.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Redirecting in {countdown}s...
          </div>
          
          <button 
            onClick={() => navigate(redirectUrl)}
            className="btn-primary" 
            style={{ width: '100%', height: '48px', borderRadius: '14px', background: '#10b981', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            Go Now <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
