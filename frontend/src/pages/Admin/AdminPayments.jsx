import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CreditCard, Calendar, User, TrendingUp, 
  ArrowRight, Wallet, Rocket, Filter, Search,
  ArrowUpRight, ShieldCheck, Clock, Download,
  MoreVertical, ChevronRight, CheckCircle, Info
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

  const totalProfit = stats.reduce((acc, s) => acc + s.revenue, 0);

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
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Realized Profit</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>₹{totalProfit.toLocaleString()}</div>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#10b981" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {stats.map((s, idx) => {
          const config = TYPE_CONFIG[s._id] || { label: s._id, icon: DollarSign, color: '#64748b', bg: '#f1f5f9' };
          return (
            <motion.div 
              key={s._id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card" 
              style={{ padding: '1.75rem', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <config.icon size={24} color={config.color} />
                </div>
                <div style={{ padding: '0.4rem 0.75rem', borderRadius: '999px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  Verified
                </div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>₹{s.revenue?.toLocaleString()}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{config.label} Revenue</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> From {s.count} unique transactions
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Transactions Ledger */}
      <div className="card" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Transaction Ledger</h3>
            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-muted)', fontWeight: 700, border: '1px solid var(--border)' }}>{total} Records</span>
          </div>
          <button style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <Download size={14} /> Export CSV
          </button>
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i}><td colSpan="5" style={{ padding: '1.5rem' }}><div className="skeleton" style={{ height: '50px', borderRadius: '12px' }} /></td></tr>)
              ) : (
                transactions.map((t, idx) => {
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
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t.razorpay_payment_id || 'ID_PENDING'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ORD_{t.razorpay_order_id?.slice(-8)}</div>
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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>of {Math.ceil(total / 20) || 1}</span>
          </div>
          <button onClick={() => setPage(p => p+1)} className="btn-secondary" disabled={transactions.length < 20} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}>Next</button>
        </div>
      </div>

      <style>{`
        .table-row-hover:hover {
          background: rgba(99,102,241,0.02) !important;
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
