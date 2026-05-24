import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CreditCard, Calendar, User, TrendingUp, 
  ArrowRight, Wallet, Rocket, Filter, Search,
  ArrowUpRight, ShieldCheck, Clock, Download,
  MoreVertical, ChevronRight, CheckCircle, Info, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('subscription');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/payments?page=${page}`);
      setTransactions(data.transactions);
      setStats(data.stats);
      setTotal(data.total);
    } catch (e) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const TYPE_CONFIG = {
    subscription: { label: 'Platform Upgrade', icon: CreditCard, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    investment_commission: { label: 'Deal Commission', icon: Wallet, color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
  };

  const filteredTransactions = transactions.filter(t => t.type === activeTab);
  const activeStat = stats.find(s => s._id === activeTab) || { revenue: 0, count: 0 };
  const totalProfit = activeStat.revenue;

  const generateReceipt = (t) => {
    const isSub = t.type === 'subscription';
    const printWindow = window.open('', '_blank');
    const amount = t.amount || 0;
    
    let baseAmountHtml = '';
    if (t.metadata?.baseAmount) {
      baseAmountHtml = `
        <div class="row">
          <span>Deal Amount:</span>
          <span>₹${t.metadata.baseAmount.toLocaleString()}</span>
        </div>
        <div class="row">
          <span>PIE Commission (2%):</span>
          <span>₹${amount.toLocaleString()}</span>
        </div>
      `;
    } else {
      baseAmountHtml = `
        <div class="row">
          <span>Amount Paid:</span>
          <span>₹${amount.toLocaleString()}</span>
        </div>
      `;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Receipt - ${t.razorpay_payment_id || t._id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
            .logo { font-size: 32px; font-weight: 900; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -1px; }
            .title { font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 2px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .info-block strong { display: block; font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
            .info-block span { font-size: 16px; font-weight: 600; color: #0f172a; }
            .details { background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 40px; }
            .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
            .row:last-child { border-bottom: none; }
            .row span:first-child { font-weight: 600; color: #475569; }
            .row span:last-child { font-weight: 800; color: #0f172a; }
            .total-row { display: flex; justify-content: space-between; padding: 20px 0 0; margin-top: 20px; border-top: 2px solid #cbd5e1; font-size: 20px; font-weight: 900; color: #10b981; }
            .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">P.I.E</div>
              <div class="title">Payment Receipt</div>
            </div>
            
            <div class="info-grid">
              <div class="info-block">
                <strong>Transaction ID</strong>
                <span>${t.razorpay_payment_id || t._id}</span>
              </div>
              <div class="info-block">
                <strong>Date</strong>
                <span>${new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
              <div class="info-block">
                <strong>Payment Type</strong>
                <span style="text-transform: capitalize;">${t.type.replace('_', ' ')}</span>
              </div>
              <div class="info-block">
                <strong>Status</strong>
                <span style="color: #10b981; text-transform: uppercase;">${t.status}</span>
              </div>
            </div>

            <div class="details">
              <div class="row">
                <span>Description:</span>
                <span>${isSub ? 'Platform Subscription Upgrade' : 'Deal Commission'} ${t.metadata?.plan ? '(' + t.metadata.plan + ')' : ''}</span>
              </div>
              <div class="row">
                <span>User / Entity:</span>
                <span>${isSub ? t.user?.name : t.investor?.name + ' (Investor) -> ' + t.startup?.title + ' (Startup)'}</span>
              </div>
              ${baseAmountHtml}
              <div class="total-row">
                <span>Total Paid</span>
                <span>₹${amount.toLocaleString()}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for using the Platform for Investors & Entrepreneurs!</p>
              <p>This is a computer-generated receipt.</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={24} color="white" />
            </div>
            Financial Audit
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Monitor platform revenue and commission disbursements.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {activeTab === 'subscription' ? 'Subscription Profit' : 'Commission Profit'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>₹{totalProfit.toLocaleString()}</div>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#10b981" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('subscription')}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'subscription' ? 'var(--brand-500)' : 'transparent', color: activeTab === 'subscription' ? 'white' : 'var(--text-secondary)' }}
        >
          <CreditCard size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
          Subscriptions
        </button>
        <button 
          onClick={() => setActiveTab('investment_commission')}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'investment_commission' ? 'var(--brand-500)' : 'transparent', color: activeTab === 'investment_commission' ? 'white' : 'var(--text-secondary)' }}
        >
          <Wallet size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
          Deal Commissions
        </button>
      </div>

      {/* Transactions Ledger */}
      <div className="card" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>{activeTab === 'subscription' ? 'Subscription Records' : 'Commission Records'}</h3>
            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-muted)', fontWeight: 700, border: '1px solid var(--border)' }}>{activeStat.count} Total</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem' }}>Reference ID</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Stakeholders</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Type</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Platform Profit</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Execution Date</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i}><td colSpan="6" style={{ padding: '1.5rem' }}><div className="skeleton" style={{ height: '50px', borderRadius: '12px' }} /></td></tr>)
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>No transactions found for this category.</td></tr>
              ) : (
                filteredTransactions.map((t, idx) => {
                  const config = TYPE_CONFIG[t.type] || { label: t.type, icon: DollarSign, color: '#64748b', bg: '#f1f5f9' };
                  return (
                    <motion.tr 
                      key={t._id} 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }} 
                      className="table-row-hover"
                    >
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t.razorpay_payment_id || t._id.slice(-8).toUpperCase()}</div>
                        {t.razorpay_order_id && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ORD_{t.razorpay_order_id.slice(-8)}</div>}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        {t.type === 'subscription' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img src={t.user?.avatar ? `http://localhost:5000${t.user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(t.user?.name || 'U')}`} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)' }} alt="" />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{t.user?.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{t.user?.role} Account</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{t.investor?.name?.split(' ')[0]}</div>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>INVESTOR</div>
                            </div>
                            <ArrowRight size={14} color="var(--text-muted)" />
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{t.startup?.title}</div>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>FOUNDER</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: config.color, fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', background: config.bg, padding: '0.4rem 0.75rem', borderRadius: '8px', width: 'fit-content' }}>
                          <config.icon size={14} />
                          {config.label} {t.metadata?.plan && `(${t.metadata.plan})`}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontWeight: 900, color: '#10b981', fontSize: '1.1rem' }}>
                          {t.amount === 0 ? '—' : `₹${t.amount?.toLocaleString()}`}
                        </div>
                        {t.metadata?.manualUpgrade ? (
                          <div style={{ fontSize: '0.65rem', color: '#8b5cf6', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldCheck size={10} /> MANUAL ADMIN OVERRIDE
                          </div>
                        ) : t.metadata?.baseAmount && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>OF ₹{t.metadata.baseAmount.toLocaleString()} DEAL</div>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{format(new Date(t.createdAt), 'MMM dd, yyyy')}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Executed at {format(new Date(t.createdAt), 'HH:mm')}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => generateReceipt(t)}
                          style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)' }}
                          className="btn-hover"
                        >
                          <FileText size={14} /> Receipt
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer / Pagination */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} className="btn-secondary" disabled={page === 1} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}>Previous</button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 800 }}>Page {page}</span>
          </div>
          <button onClick={() => setPage(p => p+1)} className="btn-secondary" disabled={transactions.length < 20} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}>Next</button>
        </div>
      </div>

      <style>{`
        .table-row-hover:hover {
          background: rgba(99,102,241,0.02) !important;
        }
        .btn-hover:hover {
          background: var(--brand-500) !important;
          color: white !important;
          border-color: var(--brand-500) !important;
        }
        .skeleton {
          background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--border) 50%, var(--bg-secondary) 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default AdminPayments;
