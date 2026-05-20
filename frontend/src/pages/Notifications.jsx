import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Check, Trash2, ShieldCheck, Heart, MessageSquare, 
  DollarSign, Rocket, Brain, Star, CheckCircle, Clock,
  Filter, MoreHorizontal, Settings, Info, BellOff, ArrowRight,
  UserPlus, Zap, MessageCircle, TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';

const ICONS = { 
  like: { icon: <Heart size={18} />, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  comment: { icon: <MessageSquare size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  message: { icon: <MessageCircle size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  investment_offer: { icon: <DollarSign size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  follow: { icon: <UserPlus size={18} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  startup_approved: { icon: <Rocket size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  startup_rejected: { icon: <BellOff size={18} />, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  analysis_ready: { icon: <Brain size={18} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  subscription: { icon: <ShieldCheck size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  investment_approved: { icon: <TrendingUp size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  investment_rejected: { icon: <BellOff size={18} />, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  report_resolved: { icon: <ShieldCheck size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
};

const Notifications = () => {
  const { notifications, unreadCount, setNotifications, markAllRead, markRead, clearNotification, clearAll } = useNotificationStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.notifications, data.unreadCount);
      } catch(e) {} finally { setLoading(false); }
    })();
  }, []);

  const handleMarkAll = async () => {
    try {
      await api.put('/notifications/read-all');
      markAllRead();
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to mark as read');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    try {
      await api.delete('/notifications');
      clearAll();
      toast.success('All notifications cleared');
    } catch (e) {
      toast.error('Failed to clear notifications');
    }
  };

  const handleClick = async (n) => {
    if (!n.read) { 
      try {
        await api.put(`/notifications/${n._id}/read`); 
        markRead(n._id); 
      } catch (e) {}
    }
  };

  const handleDel = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      clearNotification(id);
      toast.success('Deleted');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'offers') return notifications.filter(n => n.type === 'investment_offer');
    if (filter === 'activity') return notifications.filter(n => ['like', 'comment', 'follow'].includes(n.type));
    return notifications;
  }, [notifications, filter]);

  const unreadSection = useMemo(() => filteredNotifications.filter(n => !n.read), [filteredNotifications]);
  const earlierSection = useMemo(() => filteredNotifications.filter(n => n.read), [filteredNotifications]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const today = [];
    const earlier = [];
    const now = new Date();
    
    filteredNotifications.forEach(n => {
      const d = new Date(n.createdAt);
      if (d.toDateString() === now.toDateString()) today.push(n);
      else earlier.push(n);
    });
    
    return { today, earlier };
  }, [filteredNotifications]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '6rem', minHeight: '100vh', padding: '0 1rem' }}>
      <style>{`
        .notif-card {
          padding: 1.25rem;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border);
          margin-bottom: 0.75rem;
        }
        .notif-card:hover {
          transform: translateY(-2px);
          border-color: var(--brand-500);
          box-shadow: 0 12px 30px rgba(99,102,241,0.08);
        }
        .notif-unread {
          background: var(--bg-secondary);
          border-left: 4px solid var(--brand-500);
        }
        .notif-unread-dot {
          width: 8px; height: 8px; border-radius: 50%; background: var(--brand-500);
          box-shadow: 0 0 10px var(--brand-500);
        }
        .filter-container {
          background: var(--bg-secondary);
          padding: 0.35rem;
          border-radius: 16px;
          display: inline-flex;
          gap: 0.25rem;
          border: 1px solid var(--border);
        }
        .filter-chip {
          padding: 0.6rem 1.1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--text-muted);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .filter-chip.active {
          background: var(--bg-card);
          color: var(--brand-500);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .section-header {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 2rem 0 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .section-header::after {
          content: ''; flex: 1; height: 1px; background: var(--border-subtle);
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ paddingTop: '3rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
              Notifications
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
              Stay updated with your network activity.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="btn-ghost" style={{ fontSize: '0.85rem', fontWeight: 700, gap: '0.5rem' }}>
                <CheckCircle size={16} /> Mark all read
              </button>
            )}
            <button onClick={() => navigate('/settings?tab=notifications')} className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '12px' }}>
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-container">
          {[
            { id: 'all', label: 'All', icon: <Bell size={15} /> },
            { id: 'unread', label: 'Unread', icon: <Zap size={15} /> },
            { id: 'offers', label: 'Offers', icon: <DollarSign size={15} /> },
            { id: 'activity', label: 'Activity', icon: <Heart size={15} /> }
          ].map(f => (
            <button 
              key={f.id} 
              onClick={() => setFilter(f.id)} 
              className={`filter-chip ${filter === f.id ? 'active' : ''}`}
            >
              {f.icon} {f.label}
              {f.id === 'unread' && unreadCount > 0 && (
                <span style={{ background: 'var(--brand-500)', color: 'white', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '5px' }}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '20px' }} />)}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-secondary)', borderRadius: '32px', border: '1px dashed var(--border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem', opacity: 0.5 }}>🔔</div>
          <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>All caught up!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No notifications found in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="popLayout">
            {groupedNotifications.today.length > 0 && (
              <motion.div key="today" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="section-header">Today</div>
                {groupedNotifications.today.map(n => <NotificationItem key={n._id} n={n} onClick={handleClick} onDel={handleDel} />)}
              </motion.div>
            )}

            {groupedNotifications.earlier.length > 0 && (
              <motion.div key="earlier" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="section-header">Earlier</div>
                {groupedNotifications.earlier.map(n => <NotificationItem key={n._id} n={n} onClick={handleClick} onDel={handleDel} />)}
              </motion.div>
            )}
          </AnimatePresence>

          {notifications.length > 0 && (
            <button 
              onClick={handleClearAll} 
              style={{ marginTop: '3rem', alignSelf: 'center', color: 'var(--accent-rose)', fontSize: '0.85rem', fontWeight: 800, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Trash2 size={16} /> Clear All History
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const NotificationItem = ({ n, onClick, onDel }) => {
  const iconData = ICONS[n.type] || { icon: <Bell size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestObj, setRequestObj] = useState(null);
  const navigate = useNavigate();

  const senderAvatar = n.sender?.avatar 
    ? `http://localhost:5000${n.sender.avatar}` 
    : (n.sender?.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(n.sender.name)}&background=6366f1&color=fff` : null);

  const handleToggle = async () => {
    onClick(n);
    const willExpand = !expanded;
    setExpanded(willExpand);

    if (willExpand && n.type === 'follow' && !requestObj) {
      setLoading(true);
      try {
        const { data } = await api.get('/auth/requests');
        const req = data.find(r => r.from?._id === (n.sender?._id || n.sender));
        if (req) setRequestObj(req);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAccept = async (e) => {
    e.stopPropagation();
    try {
      await api.post(`/auth/requests/${requestObj._id}/accept`);
      toast.success('Request accepted!');
      setRequestObj(prev => ({ ...prev, status: 'accepted' }));
    } catch (err) {
      toast.error('Failed to accept');
    }
  };

  const handleDecline = async (e) => {
    e.stopPropagation();
    try {
      await api.post(`/auth/requests/${requestObj._id}/decline`);
      toast.success('Request declined');
      setRequestObj(prev => ({ ...prev, status: 'declined' }));
    } catch (err) {
      toast.error('Failed to decline');
    }
  };

  const handleAction = (e) => {
    e.stopPropagation();
    if (n.link) navigate(n.link);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <motion.div 
        layout 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }} 
        className={`notif-card ${!n.read ? 'notif-unread' : ''}`}
        onClick={handleToggle}
      >
        <div className="premium-glow" />
        
        {/* Avatar or Icon */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {senderAvatar ? (
            <img src={senderAvatar} alt="Sender" style={{ width: '56px', height: '56px', borderRadius: '18px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          ) : (
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: iconData.bg, color: iconData.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {iconData.icon}
            </div>
          )}
          <div style={{ 
            position: 'absolute', bottom: -4, right: -4, 
            width: '24px', height: '24px', borderRadius: '50%', 
            background: iconData.bg, color: iconData.color, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            border: '3px solid var(--bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
          }}>
            {React.cloneElement(iconData.icon, { size: 11 })}
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: 0, paddingTop: '0.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <div style={{ fontWeight: n.read ? 700 : 900, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {n.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: false }) : ''}
              </span>
              {!n.read && <div className="notif-unread-dot" />}
            </div>
          </div>
          <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {n.body}
          </div>
        </div>

        <button onClick={(e) => { e.stopPropagation(); onDel(e, n._id); }} className="btn-del-notif">
          <Trash2 size={18} />
        </button>
      </motion.div>

      {/* Expanded Details Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            style={{ overflow: 'hidden', margin: '-0.5rem 1rem 1rem' }}
          >
            <div style={{ 
              padding: '2rem', 
              background: 'linear-gradient(to bottom, var(--bg-secondary), var(--bg-card))', 
              borderRadius: '0 0 24px 24px', 
              border: '1px solid var(--border)',
              borderTop: 'none',
              boxShadow: '0 15px 30px rgba(0,0,0,0.05)',
              display: 'flex',
              gap: '1.75rem'
            }}>
              <div style={{ width: '4px', borderRadius: '4px', background: `linear-gradient(to bottom, ${iconData.color}, transparent)`, alignSelf: 'stretch' }} />
              
              <div style={{ flex: 1 }}>
                {n.type === 'follow' ? (
                  <div>
                    <h4 style={{ fontWeight: 900, marginBottom: '0.75rem', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Networking Request</h4>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
                      <strong>{n.sender?.name || 'A professional'}</strong> would like to connect. Accepting this request will allow them to follow your profile and see your startup updates in their feed.
                    </p>
                    {loading ? (
                      <div className="skeleton" style={{ height: '40px', width: '200px', borderRadius: '12px' }} />
                    ) : requestObj ? (
                      requestObj.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button onClick={handleAccept} className="btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.9rem', borderRadius: '14px', background: '#6366f1', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Accept</button>
                          <button onClick={handleDecline} className="btn-secondary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.9rem', borderRadius: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 800, cursor: 'pointer' }}>Decline</button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.25rem', background: requestObj.status === 'accepted' ? 'rgba(16,185,129,0.08)' : 'var(--bg-card)', border: `1px solid ${requestObj.status === 'accepted' ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`, borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800, color: requestObj.status === 'accepted' ? '#10b981' : 'var(--text-muted)' }}>
                          {requestObj.status === 'accepted' ? <CheckCircle size={18} /> : <Info size={18} />}
                          Successfully {requestObj.status}
                        </div>
                      )
                    ) : (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>Request has already been processed.</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontWeight: 900, marginBottom: '0.75rem', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Activity Update</h4>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
                      {n.type === 'message' ? `You've received a secure communication. Open the messaging module to view and reply.` :
                       n.type === 'like' ? `Engagement is growing! A member has appreciated your profile. Maintaining an active presence helps attract potential investors.` :
                       n.type === 'investment_offer' ? `URGENT: A funding proposal has been received. Review the investment terms and respond promptly.` :
                       n.type === 'investment_approved' ? `Great news! Your investment track record has been verified by our team. It is now visible to the public on your profile.` :
                       n.type === 'investment_rejected' ? `Your recent investment submission requires attention. Please review the rejection reason and provide updated evidence if necessary.` :
                       n.type === 'report_resolved' ? `Thank you for helping keep our community safe. Your report has been reviewed and appropriate action has been taken according to our guidelines.` :
                       `A system update regarding your account activity. We recommend reviewing the details to stay informed on your platform progress.`}
                    </p>
                    {n.link && (
                      <button onClick={handleAction} style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s' }}>
                        View Details <ArrowRight size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
