import React, { useState, useEffect } from 'react';
import { 
  Rocket, CheckCircle, XCircle, Clock, FileText, 
  MapPin, Users, Target, Info, ArrowUpRight, 
  Search, Filter, ExternalLink, MessageSquare, 
  Trash2, ShieldCheck, AlertCircle, X, Calendar,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminStartups = () => {
  const [startups, setStartups] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('');

  const fetchStartups = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/startups?status=${status}`);
      setStartups(data.startups);
    } catch (e) {
      toast.error('Failed to load startups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, [status]);

  const handleApprove = async (id) => {
    try { 
      await api.put(`/admin/startups/${id}/approve`); 
      setStartups(p => p.filter(s => s._id !== id)); 
      toast.success('Startup approved and live!'); 
    } catch { 
      toast.error('Failed to approve startup'); 
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return toast.error('Please provide a reason');
    try { 
      await api.put(`/admin/startups/${rejectId}/reject`, { reason }); 
      setStartups(p => p.filter(s => s._id !== rejectId)); 
      setRejectId(null); 
      setReason(''); 
      toast.success('Startup rejected and founder notified.'); 
    } catch { 
      toast.error('Failed to reject startup'); 
    }
  };

  const STATUS_CONFIG = {
    pending: { label: 'Pending Queue', icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    approved: { label: 'Approved Startups', icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    rejected: { label: 'Rejected List', icon: XCircle, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Rocket size={24} color="white" />
            </div>
            Startup Verification
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Review and moderate new platform submissions.</p>
        </div>

        {/* Tab System */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '16px', border: '1px solid var(--border)', gap: '0.25rem' }}>
          {['pending', 'approved', 'rejected'].map(t => {
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
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
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
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '24px' }} />)}
        </div>
      ) : startups.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '6rem 2rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '32px', border: '1px dashed var(--border)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Rocket size={40} style={{ opacity: 0.2 }} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No {status} startups found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>All quiet in the {status} queue. New submissions will appear here for review.</p>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1.5rem' }}>
          {startups.map((s, idx) => (
            <motion.div 
              key={s._id} 
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
                position: 'relative',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Top Row: Logo & Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {s.logo ? (
                    <img src={`http://localhost:1110${s.logo}`} alt="" style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover', border: '1px solid var(--border)', padding: '4px', background: 'var(--bg-primary)' }} />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.5rem' }}>
                      {s.title[0]}
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>{s.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', textTransform: 'uppercase' }}>{s.industry}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', textTransform: 'uppercase' }}>{s.stage}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <Calendar size={12} /> {s.createdAt ? format(new Date(s.createdAt), 'MMM dd') : ''}
                  </div>
                  <span>{s.createdAt ? formatDistanceToNow(new Date(s.createdAt), { addSuffix: true }) : ''}</span>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {s.description || 'No description provided.'}
              </p>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={16} color="#6366f1" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Location</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{s.location || 'Remote'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} color="#8b5cf6" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Founder</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{s.founder?.name || 'Unknown'}</div>
                  </div>
                </div>
              </div>

              {/* Status Specific Info */}
              {status === 'rejected' && s.rejectionReason && (
                <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'rgba(244,63,94,0.05)', borderRadius: '16px', border: '1px solid rgba(244,63,94,0.1)' }}>
                  <AlertCircle size={18} color="#f43f5e" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f43f5e', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Rejection Reason</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.rejectionReason}</div>
                  </div>
                </div>
              )}

              {/* Actions Area */}
              <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                {s.verificationDocument ? (
                  <a 
                    href={`http://localhost:1110${s.verificationDocument}`} 
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
                      borderRadius: '10px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  >
                    <FileText size={16} color="#6366f1" /> Documents
                  </a>
                ) : <div />}

                {status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      onClick={() => setRejectId(s._id)} 
                      style={{ 
                        padding: '0.6rem 1.25rem', 
                        borderRadius: '12px', 
                        background: 'rgba(244,63,94,0.1)', 
                        color: '#f43f5e', 
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => handleApprove(s._id)} 
                      style={{ 
                        padding: '0.6rem 1.5rem', 
                        borderRadius: '12px', 
                        background: '#10b981', 
                        color: 'white', 
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                      }}
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                  </div>
                )}
                
                {(status === 'approved' || status === 'rejected') && (
                  <button style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    View Full Details <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modern Rejection Modal */}
      <AnimatePresence>
        {rejectId && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} 
              onClick={() => setRejectId(null)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '480px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(244,63,94,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <AlertCircle size={32} color="#f43f5e" />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Decline Submission</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Please provide a clear reason for the founder. This will help them improve their profile.
                </p>
                <textarea 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  placeholder="e.g. Verification document incomplete, logo blurry..." 
                  style={{ width: '100%', minHeight: '120px', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'none', marginBottom: '1.5rem', outline: 'none' }} 
                />
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <button onClick={() => setRejectId(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleReject} style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', border: 'none', background: '#f43f5e', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(244,63,94,0.3)' }}>Reject & Notify</button>
                </div>
              </div>
              <button onClick={() => setRejectId(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
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

export default AdminStartups;
