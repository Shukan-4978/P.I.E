import PieLoader from '../../components/common/PieLoader';
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, CheckCircle, XCircle, Clock, FileText, 
  Globe, Briefcase, DollarSign, Calendar, MapPin,
  ExternalLink, User, ArrowUpRight, Search, Filter,
  ShieldCheck, AlertCircle, ChevronRight, X
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminInvestments = () => {
  const [investments, setInvestments] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [rejectData, setRejectData] = useState(null); // { userId, investmentId }
  const [reason, setReason] = useState('');

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/investments?status=${status}`);
      setInvestments(data.investments);
    } catch (e) {
      toast.error('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [status]);

  const handleApprove = async (userId, investmentId) => {
    try { 
      await api.put(`/admin/investments/${userId}/${investmentId}/approve`); 
      setInvestments(p => p.filter(i => i.investment._id !== investmentId)); 
      toast.success('Investment verified successfully!'); 
    } catch { 
      toast.error('Failed to verify investment'); 
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return toast.error('Please provide a rejection reason');
    try { 
      await api.put(`/admin/investments/${rejectData.userId}/${rejectData.investmentId}/reject`, { reason }); 
      setInvestments(p => p.filter(i => i.investment._id !== rejectData.investmentId)); 
      setRejectData(null); 
      setReason(''); 
      toast.success('Investment proof rejected.'); 
    } catch { 
      toast.error('Failed to reject investment'); 
    }
  };

  const STATUS_CONFIG = {
    pending: { label: 'Verification Queue', icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    accepted: { label: 'Verified Portfolio', icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    rejected: { label: 'Declined Proofs', icon: XCircle, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} color="white" />
            </div>
            Track Record Moderation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Verify investment proofs and validate platform credibility.</p>
        </div>

        {/* Tab System */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '16px', border: '1px solid var(--border)', gap: '0.25rem' }}>
          {['pending', 'accepted', 'rejected'].map(t => {
            const isActive = status === t;
            const config = STATUS_CONFIG[t];
            return (
              <button 
                key={t} 
                onClick={() => setStatus(t)} 
                style={{ 
                  padding: '0.6rem 1.25rem', 
                  borderRadius: '12px', 
                  border: 'none',
                  background: isActive ? 'var(--bg-secondary)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <config.icon size={16} color={isActive ? config.color : 'var(--text-muted)'} />
                {config.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><PieLoader /></div>) : investments.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: '6rem 2rem', textAlign: 'center', borderRadius: '32px', border: '1px dashed var(--border)' }}>
          <TrendingUp size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No {status} entries</h3>
          <p style={{ color: 'var(--text-secondary)' }}>The {status} investment queue is currently empty.</p>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1.5rem' }}>
          {investments.map((record, idx) => {
            const user = { _id: record._id, name: record.name, email: record.email, avatar: record.avatar };
            const inv = record.investment;
            
            return (
              <motion.div 
                key={inv._id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card" 
                style={{ 
                  padding: '1.75rem', 
                  borderRadius: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.5rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  transition: 'transform 0.3s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                {/* User & Company Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img 
                      src={user.avatar ? `${user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=48`} 
                      style={{ width: '48px', height: '48px', borderRadius: '14px', border: '2px solid var(--border)' }} 
                      alt="" 
                    />
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '0.1rem' }}>{inv.companyName}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>By {user.name}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{inv.amount || 'Undisclosed'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>INVESTMENT SIZE</div>
                  </div>
                </div>

                {/* Data Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Sector', value: inv.sector || '—', icon: Briefcase, color: '#6366f1' },
                    { label: 'Year', value: inv.year, icon: Calendar, color: '#8b5cf6' },
                    { label: 'Round', value: inv.round || '—', icon: ShieldCheck, color: '#10b981' }
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Location & Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {inv.location ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--brand-500)', fontWeight: 700 }}>
                      <MapPin size={14} /> {inv.location}
                    </div>
                  ) : <div />}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {inv.createdAt ? formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true }) : ''}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {inv.proof ? (
                    <a 
                      href={`${inv.proof}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        color: 'var(--text-primary)', 
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '10px'
                      }}
                    >
                      <FileText size={16} color="#6366f1" /> View Proof
                    </a>
                  ) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No proof provided</span>}

                  {status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={() => setRejectData({ userId: user._id, investmentId: inv._id })} 
                        style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: 'none', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                      >
                        <XCircle size={16} /> Decline
                      </button>
                      <button 
                        onClick={() => handleApprove(user._id, inv._id)} 
                        style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}
                      >
                        <CheckCircle size={16} /> Verify
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectData && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setRejectData(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '440px', borderRadius: '24px', padding: '2rem', position: 'relative', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Decline Proof</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Provide a reason for the investor to correct their submission.</p>
              <textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="e.g., Document is unreadable, incorrect company name..." 
                style={{ width: '100%', minHeight: '120px', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', marginBottom: '1.5rem' }} 
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setRejectData(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleReject} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: '#f43f5e', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Confirm Decline</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInvestments;
