import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, CheckCircle, XCircle, Clock, 
  ShieldCheck, Zap, Diamond, ChevronRight, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const STATUS_CONFIG = {
  active: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle, label: 'Active' },
  cancelled: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', icon: XCircle, label: 'Expired' },
  past_due: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock, label: 'Pending' },
  inactive: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', icon: Clock, label: 'No Plan' },
};

const PLAN_FEATURES = {
  free: ['5 Connections/mo', '10 Messages/day', '2 Posts/mo', '1 Startup/mo'],
  plus: ['10 Connections/mo', '25 Messages/day', '5 AI Analyses/mo', '2 Startups/mo'],
  pro: ['20 Connections/mo', '100 Messages/day', '10 AI Advisor msgs', '5 Startups/mo', 'AI Match Unlocked'],
  premium: ['Unlimited Connections', 'Unlimited Messages', 'Unlimited AI Analysis', 'Unlimited Startups', 'Verified Badge']
};

const Billing = () => {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { 
        const { data } = await api.get('/payments/subscription'); 
        setSubscription(data); 
      }
      catch(e) {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  const cfg = STATUS_CONFIG[subscription?.status] || STATUS_CONFIG.inactive;
  const currentPlan = subscription?.plan || user?.subscriptionPlan || 'free';
  const usage = user?.usageStats || {};

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="loader-spin" /></div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .loader-spin { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .billing-hero { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 3rem 2rem; border-radius: 24px; color: white; margin-bottom: 2rem; position: relative; overflow: hidden; }
        .billing-hero::after { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%; }
        .member-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; aspect-ratio: 1.6 / 1; width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
      `}</style>

      {/* Hero Section */}
      <div className="billing-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>Billing & Subscription</h1>
            <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>Manage your plan and transaction history.</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <Link to="/pricing"><button className="btn-primary" style={{ background: 'white', color: '#6366f1', fontWeight: 700 }}>
                Upgrade Plan
              </button></Link>
            </div>
          </div>

          <div className="member-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '2px' }}>P.I.E</div>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Current Plan</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {currentPlan === 'premium' ? <Diamond size={18} /> : currentPlan === 'pro' ? <Zap size={18} /> : null}
                {currentPlan} Member
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>Expires: {subscription?.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy') : '—'}</div>
              </div>
              <div style={{ background: 'white', color: cfg.color, padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800 }}>{cfg.label}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} color="#6366f1" /> Plan Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Payment Status</div>
                <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{subscription?.status || 'No Active Plan'}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Expiry Date</div>
                <div style={{ fontWeight: 700 }}>{subscription?.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy') : 'N/A'}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Current Usage:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2.5rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Messages (Today)</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{usage.messagesToday?.count || 0} Sent</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Connections (Month)</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{usage.connectionsMonth?.count || 0} Sent</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Startups (Month)</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{usage.startupsMonth?.count || 0} Added</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Analysis (Month)</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{usage.aiAnalysisMonth?.count || 0} Used</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Included with your {currentPlan} plan:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {(PLAN_FEATURES[currentPlan] || []).map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={16} color="#10b981" /> {feat}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="#6366f1" /> Transaction History
            </h3>
            {subscription?.billingHistory?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {subscription.billingHistory.map((inv, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} color="var(--text-muted)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{inv.paidAt ? format(new Date(inv.paidAt), 'MMM d, yyyy') : 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {inv.invoiceId}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>₹{inv.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <CreditCard size={30} color="var(--text-muted)" />
                </div>
                <p style={{ color: 'var(--text-muted)' }}>No transactions yet.</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-tertiary)', border: 'none' }}>
            <h4 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>Razorpay Secure</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>All payments are processed securely via Razorpay. We do not store your card details.</p>
            <button className="btn-secondary" style={{ width: '100%', background: 'var(--bg-card)' }}>Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
