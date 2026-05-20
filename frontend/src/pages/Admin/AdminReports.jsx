import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, XCircle, Clock, Trash2, 
  Search, ExternalLink, AlertTriangle, User, 
  MessageSquare, Rocket, ShieldAlert, Flag,
  ChevronRight, ArrowRight, Ban, Eye
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/reports?status=${status}&page=${page}&limit=20`);
      setReports(data.reports);
    } catch(e) {
      toast.error('Failed to load reports');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchReports(); 
  }, [status, page]);

  const handleUpdate = async (id, action) => {
    try {
      await api.put(`/admin/reports/${id}`, { status: action });
      setReports(p => p.filter(r => r._id !== id));
      toast.success(`Report marked as ${action}`);
    } catch { 
      toast.error('Failed to update report status'); 
    }
  };

  const STATUS_TABS = [
    { id: 'pending', label: 'Action Required', icon: Clock, color: '#f43f5e' }, 
    { id: 'resolved', label: 'Resolved', icon: CheckCircle, color: '#10b981' }, 
    { id: 'dismissed', label: 'Dismissed', icon: XCircle, color: '#64748b' }
  ];

  const TYPE_ICON = {
    user: { icon: User, color: '#6366f1' },
    startup: { icon: Rocket, color: '#8b5cf6' },
    post: { icon: MessageSquare, color: '#10b981' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f43f5e, #fb7185)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flag size={24} color="white" />
            </div>
            Safety & Moderation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Manage user reports and maintain platform integrity.</p>
        </div>

        {/* Tab System */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '16px', border: '1px solid var(--border)', gap: '0.25rem' }}>
          {STATUS_TABS.map(t => {
            const isActive = status === t.id;
            return (
              <button 
                key={t.id} 
                onClick={() => { setStatus(t.id); setPage(1); }} 
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
                <t.icon size={16} color={isActive ? t.color : 'var(--text-muted)'} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '24px' }} />)}
        </div>
      ) : reports.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: '6rem 2rem', textAlign: 'center', borderRadius: '32px', border: '1px dashed var(--border)' }}>
          <ShieldAlert size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No {status} reports</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Everything looks clean in the {status} queue.</p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reports.map((r, idx) => {
            const typeConfig = TYPE_ICON[r.type] || { icon: Flag, color: '#64748b' };
            
            return (
              <motion.div 
                key={r._id} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card" 
                style={{ 
                  padding: '1.75rem', 
                  borderRadius: '24px', 
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Accent Line */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: typeConfig.color }} />

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {/* Reporter Info */}
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${typeConfig.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <typeConfig.icon size={18} color={typeConfig.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{r.type} report</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>From {r.reporter?.name || 'Anonymous'}</div>
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', position: 'relative' }}>
                      <AlertTriangle size={16} color="#f43f5e" style={{ position: 'absolute', right: '1rem', top: '1rem' }} />
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Report Reason</div>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{r.reason}"
                      </p>
                    </div>
                  </div>

                  {/* Context Block */}
                  <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reported Content</div>
                    
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      {r.type === 'user' && r.reportedUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={r.reportedUser.avatar ? `http://localhost:5000${r.reportedUser.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.reportedUser.name)}`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="" />
                          <div>
                            <div style={{ fontWeight: 800 }}>{r.reportedUser.name}</div>
                            <Link to={`/profile/${r.reportedUser._id}`} style={{ fontSize: '0.75rem', color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>View Profile <ArrowRight size={12} /></Link>
                          </div>
                        </div>
                      )}
                      {r.type === 'startup' && r.reportedStartup && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{r.reportedStartup.title[0]}</div>
                          <div>
                            <div style={{ fontWeight: 800 }}>{r.reportedStartup.title}</div>
                            <Link to={`/startups/${r.reportedStartup._id}`} style={{ fontSize: '0.75rem', color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>Visit Startup <ArrowRight size={12} /></Link>
                          </div>
                        </div>
                      )}
                      {r.type === 'post' && r.reportedPost && (
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                            "{r.reportedPost.content}"
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(r.reportedPost.author?.name || 'A')}`} style={{ width: '20px', height: '20px', borderRadius: '50%' }} alt="" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{r.reportedPost.author?.name}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Reported {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ''}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                {status === 'pending' && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    {r.type === 'post' && r.reportedPost && (
                      <button 
                        onClick={() => {
                          api.delete(`/posts/${r.reportedPost._id}`).then(() => handleUpdate(r._id, 'resolved')).catch(()=>toast.error('Failed to delete post'));
                        }} 
                        style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', border: 'none', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <Trash2 size={16} /> Delete Post
                      </button>
                    )}
                    {r.type === 'user' && r.reportedUser && (
                      <button 
                        onClick={() => {
                          api.put(`/admin/users/${r.reportedUser._id}/block`).then(() => handleUpdate(r._id, 'resolved')).catch(()=>toast.error('Failed to block user'));
                        }} 
                        style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', border: 'none', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <Ban size={16} /> Block Account
                      </button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button 
                      onClick={() => handleUpdate(r._id, 'dismissed')} 
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Dismiss
                    </button>
                    <button 
                      onClick={() => handleUpdate(r._id, 'resolved')} 
                      style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', border: 'none', background: '#6366f1', color: 'white', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
                    >
                      Mark Resolved
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && reports.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button 
            onClick={() => setPage(p => Math.max(1, p-1))} 
            className="btn-secondary" 
            disabled={page === 1}
            style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}
          >
            Previous
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 800 }}>
            <span style={{ color: 'var(--text-muted)' }}>Page</span> {page}
          </div>
          <button 
            onClick={() => setPage(p => p+1)} 
            className="btn-secondary" 
            disabled={reports.length < 20}
            style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
