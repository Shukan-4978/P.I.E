import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const PLANS = [
  { 
    id: 'free', 
    name: 'PIE Free', 
    price: 0, 
    yearlyPrice: 0,
    color: 'var(--text-secondary)', 
    features: [
      '5 connections/month',
      'Messages Locked (Plus+ only)',
      '2 posts/month',
      '1 startup/investment add/mo',
      'AI Analysis & Advisor Locked',
      'AI Match Locked'
    ], 
    cta: 'Current Plan', 
    popular: false 
  },
  { 
    id: 'plus', 
    name: 'PIE Plus', 
    price: 51, 
    yearlyPrice: 490,
    color: '#10b981', 
    features: [
      '10 connections/month',
      '10 messages/day',
      '5 AI Analysis/month',
      '5 posts/month',
      '2 startups/investments add/mo',
      'AI Advisor Locked',
      'AI Match Locked'
    ], 
    cta: 'Upgrade to Plus', 
    popular: false 
  },
  { 
    id: 'pro', 
    name: 'PIE Pro', 
    price: 101, 
    yearlyPrice: 969,
    color: '#6366f1', 
    features: [
      '20 connections/month',
      '50 messages/day',
      '10 AI Analysis/month',
      '10 AI Advisor messages/mo',
      '10 posts/month',
      '5 startups/investments add/mo',
      'AI Match Unlocked',
      'Verified badge consideration'
    ], 
    cta: 'Start Pro', 
    popular: true 
  },
  { 
    id: 'premium', 
    name: 'PIE Premium', 
    price: 251, 
    yearlyPrice: 2409,
    color: '#8b5cf6', 
    features: [
      'Everything Unlimited',
      'Direct Investor Introductions',
      'Priority Support',
      'Custom Analytics',
      'Featured Profile'
    ], 
    cta: 'Go Premium', 
    popular: false 
  },
];

const Pricing = () => {
  const { token, user, setUser } = useAuthStore();
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState('');
  const navigate = useNavigate();

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planId) => {
    if (!token) return navigate('/register');
    if (planId === 'free') return;
    
    setLoading(planId);
    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
      }

      const { data: order } = await api.post('/payments/create-order', { plan: planId, yearly });
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "P.I.E Platform",
        description: `Upgrade to ${planId.toUpperCase()} Plan`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const { data } = await api.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId,
              yearly
            });
            
            if (data.success) {
              toast.success('Subscription upgraded successfully!');
              await useAuthStore.getState().fetchMe();
              // Refresh user data if possible or redirect
              navigate('/billing');
            }
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: "#6366f1" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start checkout');
    } finally { setLoading(''); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '6rem 2rem 4rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '999px', padding: '0.4rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 600, color: '#818cf8' }}>
            <Zap size={14} />Simple, Transparent Pricing
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', marginBottom: '1rem', fontWeight: 800 }}>
            Choose the right plan for <span className="gradient-text">your goals</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '540px', margin: '0 auto 2rem' }}>
            Start free, upgrade when you're ready. All paid plans include a 14-day free trial.
          </p>
          <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '0.25rem', gap: '0.25rem' }}>
            <button onClick={() => setYearly(false)} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', background: !yearly ? 'var(--bg-card)' : 'transparent', color: !yearly ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'all 0.2s' }}>Monthly</button>
            <button onClick={() => setYearly(true)} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', background: yearly ? 'var(--bg-card)' : 'transparent', color: yearly ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Yearly <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>-20%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
          {PLANS.map((plan) => (
            <div 
              key={plan.id} 
              className="card" 
              style={{ 
                padding: '2.5rem 2rem', 
                border: plan.popular ? `2px solid ${plan.color}` : '1px solid var(--border)', 
                position: 'relative', 
                transform: plan.popular ? 'scale(1.03)' : 'scale(1)', 
                boxShadow: plan.popular ? `0 20px 40px ${plan.color}20` : '0 4px 6px -1px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${plan.color},#8b5cf6)`, color: 'white', padding: '0.4rem 1.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap', boxShadow: `0 4px 12px ${plan.color}40`, zIndex: 10 }}>⭐ Most Popular</div>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{plan.name}</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 900, color: plan.popular ? plan.color : 'var(--text-primary)' }}>
                    {plan.price === 0 ? 'Free' : `₹${yearly ? plan.yearlyPrice : plan.price}`}
                  </span>
                  {plan.price > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/month{yearly ? ' (billed yearly)' : ''}</span>}
                </div>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <Check size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                className={plan.popular ? 'btn-primary' : 'btn-secondary'}
                disabled={loading === plan.id || (user?.subscriptionPlan === plan.id)}
                style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
              >
                {loading === plan.id ? 'Processing...' : user?.subscriptionPlan === plan.id ? 'Current Plan' : <>{plan.cta}<ArrowRight size={16} /></>}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: '5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Questions?</h3>
          <p style={{ color: 'var(--text-secondary)' }}>All plans include a 14-day free trial. No credit card required for Free. Cancel anytime.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>* A 2% platform convenience fee is applied to all transactions (subscriptions & investments).</p>
          <div style={{ marginTop: '1rem' }}>
            <Link to={token ? '/billing' : '/login'} style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>Manage your subscription →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
