import PieLoader from '../components/common/PieLoader';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Edit, MapPin, Globe, Link as LinkIcon, MessageCircle, Rocket, Grid, 
  UserPlus, UserCheck, Clock, Check, X, Plus, TrendingUp, Search, Briefcase,
  DollarSign, Calendar, Heart, Share2, BadgeCheck, ExternalLink, ArrowRight,
  Tag, Award, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import PostCard from '../components/feed/PostCard';
import LocationInput from '../components/LocationInput';
import toast from 'react-hot-toast';
import { getSocket } from '../lib/socket';

// User List Modal Component
const UserListModal = ({ title, users, onClose, onRemoveFollower, onUnfollow, isOwnProfile }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={onClose}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.25rem' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '0.5rem', overflowY: 'auto', flex: 1 }}>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found.</div>
          ) : (
            users.map(u => {
              if (typeof u === 'string') return null; // Skip unpopulated string IDs gracefully
              return (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '12px', transition: 'background 0.2s' }} className="nav-item">
                  <Link to={`/profile/${u._id}`} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={u.avatar ? `${u.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=6366f1&color=fff&size=40`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {u.name || 'Unknown User'}
                        {u.isVerified && <BadgeCheck size={14} color="#8b5cf6" fill="#8b5cf630" />}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{u.role || 'User'}</div>
                    </div>
                  </Link>
                  {isOwnProfile && title === 'Followers' && (
                    <button 
                      onClick={(e) => { e.preventDefault(); onRemoveFollower(u._id); }} 
                      className="btn-secondary" 
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px', color: '#f43f5e', background: 'rgba(244,63,94,0.1)', border: 'none' }}
                    >
                      Remove
                    </button>
                  )}
                  {isOwnProfile && title === 'Following' && (
                    <button 
                      onClick={(e) => { e.preventDefault(); onUnfollow(u._id); }} 
                      className="btn-secondary" 
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px', color: '#f43f5e', background: 'rgba(244,63,94,0.1)', border: 'none' }}
                    >
                      Unfollow
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// ── Investment Detail Modal ──────────────────────────────────────────────────
const EXIT_STYLES = {
  Active:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  label: 'Active'   },
  Acquired: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)',  label: 'Acquired' },
  IPO:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)',  label: 'IPO'     },
  Closed:   { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.2)',   label: 'Closed'  },
};

const ROUND_COLORS = {
  'Pre-Seed': '#ec4899', 'Seed': '#8b5cf6', 'Series A': '#6366f1',
  'Series B': '#3b82f6', 'Series C+': '#06b6d4', 'Angel': '#10b981', 'Growth': '#f59e0b',
};

const InvestmentDetailModal = ({ inv, investorName, investorAvatar, onClose }) => {
  if (!inv) return null;
  const exitStyle = EXIT_STYLES[inv.exitStatus] || EXIT_STYLES.Active;
  const roundColor = ROUND_COLORS[inv.round] || '#6366f1';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '560px', maxHeight: '90vh',
          background: 'var(--bg-card)',
          borderRadius: '28px',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { 
            from { opacity: 0; transform: translateY(40px) scale(0.95); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
          }
          .metric-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 1rem;
            text-align: center;
            transition: all 0.3s ease;
          }
          .metric-card:hover {
            transform: translateY(-4px);
            border-color: rgba(99,102,241,0.3);
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          }
          .investor-card {
            background: linear-gradient(145deg, var(--bg-secondary), var(--bg-card));
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            gap: 1.25rem;
            transition: all 0.3s ease;
          }
          .investor-card:hover {
            border-color: rgba(16,185,129,0.3);
            box-shadow: 0 10px 30px -10px rgba(16,185,129,0.15);
          }
          /* Custom scrollbar for modal content */
          .modal-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .modal-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .modal-scroll::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 10px;
          }
          .modal-scroll::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted);
          }
        `}</style>

        {/* Header Banner */}
        <div style={{
          height: '110px', position: 'relative', flexShrink: 0,
          background: `linear-gradient(135deg, ${roundColor}, ${exitStyle.color})`
        }}>
          <div style={{ position:'absolute', inset:0, opacity:0.1, backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'24px 24px' }} />
          
          <button
            onClick={onClose}
            style={{ 
              position:'absolute', top:'1rem', left:'1rem', 
              width:'36px', height:'36px', borderRadius:'50%', 
              background:'rgba(0,0,0,0.2)', backdropFilter:'blur(8px)', 
              border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', 
              display:'flex', alignItems:'center', justifyContent:'center', 
              color:'white', transition:'all 0.2s', zIndex: 10
            }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(0,0,0,0.2)'}
          >
            <X size={18} />
          </button>

          <div style={{ 
            position:'absolute', top:'1rem', right:'1rem', 
            padding:'0.4rem 0.8rem', borderRadius:'12px', 
            background:'rgba(255,255,255,0.15)', backdropFilter:'blur(12px)', 
            border:'1px solid rgba(255,255,255,0.2)', color:'white', 
            fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.05em',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            textTransform: 'uppercase'
          }}>
            <Activity size={14} /> {exitStyle.label}
          </div>

          {/* Overlapping Company Logo */}
          <div style={{ 
            position:'absolute', bottom:'-24px', left:'2rem', 
            width:'70px', height:'70px', borderRadius:'20px', 
            background:'var(--bg-card)', border:'1px solid var(--border)', 
            boxShadow:'0 10px 25px rgba(0,0,0,0.1)', 
            display:'flex', alignItems:'center', justifyContent:'center', 
            fontSize:'2rem', fontWeight:900, color:roundColor,
            zIndex: 5
          }}>
            {inv.companyName?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Content Body */}
        <div className="modal-scroll" style={{ padding: '2.5rem 2rem 1.5rem', flex: 1, overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.1 }}>
                {inv.companyName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {inv.location && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inv.location)}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    <MapPin size={14} /> {inv.location}
                  </a>
                )}
                {inv.website && (
                  <>
                    <span style={{ color: 'var(--border)' }}>•</span>
                    <a href={inv.website.startsWith('http') ? inv.website : `https://${inv.website}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: roundColor, fontWeight: 700, textDecoration: 'none' }}>
                      <Globe size={14} /> Website
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            {inv.sector && (
              <div style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Briefcase size={14} color="var(--text-muted)" /> {inv.sector}
              </div>
            )}
            {inv.round && (
              <div style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: `${roundColor}15`, border: `1px solid ${roundColor}30`, color: roundColor, fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={14} /> {inv.round}
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { icon: DollarSign, label: 'Investment', value: inv.amount || 'Undisclosed', color: '#10b981' },
              { icon: Calendar, label: 'Year', value: inv.year || '—', color: '#6366f1' },
              { icon: Rocket, label: 'Exit Status', value: inv.exitStatus || '—', color: exitStyle.color },
            ].map((m, i) => (
              <div key={i} className="metric-card">
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', color: m.color }}>
                  <m.icon size={18} />
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Investor Verification */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 800 }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} strokeWidth={3} />
              </div>
              Verified Portfolio Item
            </div>
            
            <div className="investor-card">
              <img 
                src={investorAvatar} 
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(16,185,129,0.3)' }} 
                alt={investorName} 
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  Investor Entity
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {investorName}
                </div>
              </div>
              <div style={{ padding: '0.4rem 0.8rem', borderRadius: '10px', background: exitStyle.bg, color: exitStyle.color, fontSize: '0.7rem', fontWeight: 800, border: `1px solid ${exitStyle.border}` }}>
                {inv.exitStatus}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>
            This record was added by the verified investor and is subject to P.I.E platform terms.
          </p>
        </div>

      </div>
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────

const Profile = () => {
  const { id } = useParams();
  const { user: me, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [startups, setStartups] = useState([]);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]); 
  const [connectStatus, setConnectStatus] = useState('none'); 
  const [showModal, setShowModal] = useState(null); // 'followers' or 'following'
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  
  const [newInvestment, setNewInvestment] = useState({ 
    companyName: '', 
    year: new Date().getFullYear().toString(), 
    amount: '', 
    sector: '',
    round: 'Seed',
    website: '',
    exitStatus: 'Active'
  });

  const isMe = id?.toString() === me?._id?.toString();

  useEffect(() => {
    setLoading(true);
    const fetchAll = async () => {
      try {
        let profileData;
        if (isMe) {
          const { data } = await api.get('/auth/me');
          profileData = data;
        } else {
          const { data } = await api.get(`/auth/users/${id}`);
          profileData = data;
        }
        
        if (!profileData) throw new Error('Profile not found');

        setProfile(profileData);
        if (profileData.likes) {
          setIsLiked(profileData.likes.includes(me?._id));
          setLikesCount(profileData.likes.length);
        }

        setEditForm({ 
          name: profileData.name || '', 
          bio: profileData.bio || '', 
          location: profileData.location || '', 
          website: profileData.website || '', 
          linkedIn: profileData.linkedIn || '',
          investmentFocus: profileData.investmentFocus?.join(', ') || '',
          pastInvestments: profileData.pastInvestments || []
        });

        const [postsRes] = await Promise.all([
          api.get(`/posts/user/${id}`).catch(() => ({ data: [] }))
        ]);
        setPosts(postsRes.data);

        if (profileData.role === 'founder') {
          const sRes = await api.get(`/startups/user/${id}`).catch(() => ({ data: [] }));
          setStartups(sRes.data);
        }

        if (!isMe && me?._id) {
          const isFollowing = profileData.followers?.some(f => (typeof f === 'string' ? f : f._id?.toString()) === me._id?.toString());
          const isFollowedBy = profileData.following?.some(f => (typeof f === 'string' ? f : f._id?.toString()) === me._id?.toString());
          const isPending = profileData.connectionRequests?.some(r => (r.from?.toString() || r.from?._id?.toString()) === me._id?.toString() && r.status === 'pending');

          if (isFollowing && isFollowedBy) setConnectStatus('mutual');
          else if (isFollowing) setConnectStatus('following');
          else if (isFollowedBy) setConnectStatus('follow_back');
          else if (isPending) setConnectStatus('pending');
          else setConnectStatus('none');
        } else if (isMe) {
          const { data } = await api.get('/auth/requests').catch(() => ({ data: [] }));
          setRequests(data);
        }
      } catch (e) { 
        console.error('Profile Load Error:', e);
        toast.error('Failed to load profile'); 
      } finally { setLoading(false); }
    };
    fetchAll();

    const socket = getSocket();
    if (socket) {
      const handleConnectionUpdate = (data) => {
        if (data.userId === id || data.userId === me?._id) {
          fetchAll();
        }
      };
      socket.on('connection_updated', handleConnectionUpdate);
      return () => {
        socket.off('connection_updated', handleConnectionUpdate);
      };
    }
  }, [id, isMe, me?._id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.keys(editForm).forEach(key => {
        if (key === 'avatarFile' || key === 'avatarPreview') return;
        if (key === 'pastInvestments') {
          fd.append(key, JSON.stringify(editForm[key]));
        } else if (key === 'investmentFocus') {
          const focusArr = editForm[key].split(',').map(s => s.trim()).filter(Boolean);
          fd.append(key, JSON.stringify(focusArr));
        } else if (editForm[key] !== undefined) {
          fd.append(key, editForm[key]);
        }
      });
      if (editForm.avatarFile) fd.append('avatar', editForm.avatarFile);

      const { data } = await api.put('/auth/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProfile(data); 
      updateUser(data); 
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to update profile'); 
    } finally { setSaving(false); }
  };

  const addInvestment = () => {
    if (!newInvestment.companyName) return;
    setEditForm(p => ({
      ...p,
      pastInvestments: [...(p.pastInvestments || []), { ...newInvestment }]
    }));
    setNewInvestment({ 
      companyName: '', 
      year: new Date().getFullYear().toString(), 
      amount: '', 
      sector: '',
      round: 'Seed',
      website: '',
      exitStatus: 'Active'
    });
    toast.success('Investment added locally. Save to apply changes.');
  };

  const removeInvestment = (idx) => {
    setEditForm(p => ({
      ...p,
      pastInvestments: p.pastInvestments.filter((_, i) => i !== idx)
    }));
  };

  const handleMessage = async () => {
    try {
      const { data } = await api.post('/messages/conversations', { participantId: id });
      navigate(`/messages/${data._id}`);
    } catch { toast.error('Could not open conversation'); }
  };

  const handleConnect = async () => {
    try {
      await api.post(`/auth/connect/${id}`);
      setConnectStatus('pending');
      toast.success('Connection request sent!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to send request'); }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/auth/requests/${requestId}/accept`);
      setAcceptedRequests(prev => [...prev, requestId]);
      toast.success('Request accepted!');
      const req = requests.find(r => r._id === requestId);
      if (req) {
        setProfile(p => ({ ...p, followers: [...(p.followers || []), req.from] }));
      }
    } catch { toast.error('Failed to accept request'); }
  };

  const handleRequestBack = async (userId, requestId) => {
    try {
      await api.post(`/auth/connect/${userId}`);
      setAcceptedRequests(prev => prev.filter(id => id !== requestId));
      setRequests(prev => prev.filter(r => r._id !== requestId));
      toast.success('Request sent back!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await api.post(`/auth/requests/${requestId}/decline`);
      setRequests(prev => prev.filter(r => r._id !== requestId));
      toast.success('Request declined');
    } catch { toast.error('Failed to decline request'); }
  };

  const handleLike = async () => {
    if (!me) return navigate('/login');
    try {
      const { data } = await api.post(`/auth/users/${id}/like`);
      setIsLiked(data.liked);
      setLikesCount(data.count);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to like profile');
    }
  };

  const handleRemoveFollower = async (followerId) => {
    try {
      await api.delete(`/auth/followers/${followerId}`);
      setProfile(p => ({
        ...p,
        followers: p.followers.filter(f => f._id !== followerId)
      }));
      toast.success('Follower removed');
    } catch (err) {
      toast.error('Failed to remove follower');
    }
  };

  const handleUnfollow = async (targetId) => {
    try {
      await api.delete(`/auth/following/${targetId}`);
      setProfile(p => ({
        ...p,
        following: p.following.filter(f => f._id !== targetId)
      }));
      toast.success('Unfollowed user');
    } catch (err) {
      toast.error('Failed to unfollow user');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied to clipboard!');
  };

  if (loading) return <PieLoader />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .loader-spin { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .stat-btn { background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 12px; transition: background 0.2s; text-align: center; }
        .stat-btn:hover { background: var(--bg-secondary); }
      `}</style>

      {/* Profile Banner & Card */}
      <div style={{ height: '180px', borderRadius: '24px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', zIndex: 0 }}>
         <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)', backgroundSize: '40px 40px' }} />
         <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)' }} />
      </div>

      <div className="card" style={{ padding: '2.5rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1, marginTop: '-60px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -10px 30px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', marginTop: '-60px' }}>
            <img 
              src={editForm.avatarPreview || (profile?.avatar ? `${profile.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name||'U')}&background=6366f1&color=fff&size=120`)} 
              style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '6px solid var(--bg-card)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', cursor: editing ? 'pointer' : 'default', background: 'var(--bg-card)' }} 
              alt="" 
              onClick={() => editing && document.getElementById('avatarInput').click()}
            />
            {editing && (
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: '#f43f5e', color: 'white', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(244,63,94,0.4)', transition: 'transform 0.2s' }} className="hover-scale" onClick={() => document.getElementById('avatarInput').click()}>
                <Plus size={16} strokeWidth={3} />
              </div>
            )}
            <input id="avatarInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files[0];
              if (file) setEditForm(p => ({ ...p, avatarFile: file, avatarPreview: URL.createObjectURL(file) }));
            }} />
          </div>

          <div style={{ flex: 1, minWidth: '280px' }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} className="input" placeholder="Full Name" />
                  <LocationInput value={editForm.location} onChange={val => setEditForm(p=>({...p,location:val}))} />
                </div>
                <textarea value={editForm.bio} onChange={e=>setEditForm(p=>({...p,bio:e.target.value}))} className="input textarea" placeholder="Write a short bio about yourself..." style={{ minHeight: '100px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input value={editForm.website} onChange={e=>setEditForm(p=>({...p,website:e.target.value}))} className="input" placeholder="Website URL" />
                  <input value={editForm.linkedIn} onChange={e=>setEditForm(p=>({...p,linkedIn:e.target.value}))} className="input" placeholder="LinkedIn Profile URL" />
                </div>
                
                {profile?.role === 'investor' && (
                  <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '16px', padding: '1.25rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Investment Portfolio</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage your past investments & investment focus from the dedicated page.</div>
                    </div>
                    <Link to="/my-investments" style={{ textDecoration: 'none', flexShrink: 0 }}>
                      <button style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        Manage Investments →
                      </button>
                    </Link>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button onClick={() => setEditing(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Profile'}</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.03em' }}>
                    {profile?.name}
                    {profile?.isVerified && <BadgeCheck size={32} color="#8b5cf6" fill="#8b5cf630" />}
                  </h1>
                  <span className={`badge ${profile?.role === 'investor' ? 'badge-brand' : 'badge-cyan'}`} style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 900, fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>{profile?.role}</span>
                </div>
                {profile?.bio && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '1.5rem', maxWidth: '600px' }}>{profile.bio}</p>}
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                  {profile?.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}><MapPin size={18} />{profile.location}</span>}
                  {profile?.website && <a href={profile.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}><Globe size={18} />Website</a>}
                  {profile?.linkedIn && <a href={profile.linkedIn} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0077b5', textDecoration: 'none', fontWeight: 700 }}><LinkIcon size={18} />LinkedIn</a>}
                </div>
              </>
            )}
          </div>

          {!editing && (
            <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '1rem' }}>
              <button onClick={handleLike} className="btn-secondary" style={{ width: '48px', height: '48px', padding: 0, justifyContent: 'center', color: isLiked ? '#f43f5e' : 'var(--text-muted)', borderRadius: '14px' }} title="Like Profile">
                <Heart size={20} fill={isLiked ? '#f43f5e' : 'none'} />
              </button>
              <button onClick={handleShare} className="btn-secondary" style={{ width: '48px', height: '48px', padding: 0, justifyContent: 'center', borderRadius: '14px' }} title="Share Profile">
                <Share2 size={20} />
              </button>
              
              {isMe ? (
                <button onClick={() => setEditing(true)} className="btn-secondary" style={{ height: '48px', padding: '0 1.5rem', borderRadius: '14px', fontWeight: 800, gap: '0.6rem' }}>
                  <Edit size={18} /> Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {connectStatus === 'mutual' ? (
                    <button className="btn-secondary" disabled style={{ height: '48px', padding: '0 1.5rem', borderRadius: '14px', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', gap: '0.6rem' }}><UserCheck size={18} /> Connected</button>
                  ) : connectStatus === 'following' ? (
                    <button className="btn-secondary" disabled style={{ height: '48px', padding: '0 1.5rem', borderRadius: '14px', fontWeight: 800, gap: '0.6rem' }}><Check size={18} /> Following</button>
                  ) : connectStatus === 'follow_back' ? (
                    <button onClick={handleConnect} className="btn-primary" style={{ height: '48px', padding: '0 1.5rem', borderRadius: '14px', fontWeight: 800, gap: '0.6rem' }}><UserPlus size={18} /> Follow Back</button>
                  ) : connectStatus === 'pending' ? (
                    <button className="btn-secondary" disabled style={{ height: '48px', padding: '0 1.5rem', borderRadius: '14px', fontWeight: 800, gap: '0.6rem' }}><Clock size={18} /> Requested</button>
                  ) : (
                    <button onClick={handleConnect} className="btn-primary" style={{ height: '48px', padding: '0 1.5rem', borderRadius: '14px', fontWeight: 800, gap: '0.6rem' }}><UserPlus size={18} /> Connect</button>
                  )}
                  <button onClick={handleMessage} className="btn-secondary" disabled={connectStatus !== 'mutual'} style={{ height: '48px', width: '48px', padding: 0, justifyContent: 'center', borderRadius: '14px' }} title={connectStatus !== 'mutual' ? 'Connect mutually to message' : ''}>
                    <MessageCircle size={20} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <div className="stat-btn">
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{posts.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Posts</div>
          </div>
          {profile?.role === 'founder' && (
            <div className="stat-btn">
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{startups.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Startups</div>
            </div>
          )}
          <button className="stat-btn" onClick={() => setShowModal('followers')}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{profile?.followers?.length || 0}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Followers</div>
          </button>
          <button className="stat-btn" onClick={() => setShowModal('following')}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{profile?.following?.length || 0}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Following</div>
          </button>
          <div className="stat-btn" title="Profile Likes">
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f43f5e' }}>{likesCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Likes</div>
          </div>
        </div>

        {/* Industries Section */}
        {profile?.industries?.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {profile.industries.map(ind => (
              <span key={ind} className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: '0.75rem' }}>
                {ind}
              </span>
            ))}
          </div>
        )}

        {/* Investment Focus Section */}
        {profile?.role === 'investor' && profile?.investmentFocus?.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {profile.investmentFocus.map(f => <span key={f} className="badge badge-brand" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>{f}</span>)}
          </div>
        )}
      </div>

      {/* Pending Requests Section */}
      {isMe && requests.length > 0 && (
        <div style={{ marginBottom: '2.5rem', animation: 'fade-in 0.4s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                <UserPlus size={18} strokeWidth={2.5} />
              </div>
              Connection Requests
              <span style={{ background: '#f43f5e', color: 'white', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px', fontWeight: 800, boxShadow: '0 2px 8px rgba(244,63,94,0.3)' }}>{requests.length} New</span>
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {requests.map(r => {
              const isAccepted = acceptedRequests.includes(r._id);
              const alreadyFollowing = me?.following?.some(f => (typeof f === 'string' ? f : f._id?.toString()) === r.from?._id?.toString());

              return (
                <div key={r._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-card)', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                  <img src={r.from?.avatar ? `${r.from.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.from?.name || 'U')}&background=6366f1&color=fff&size=50`} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.1)' }} alt="" />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/profile/${r.from?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {r.from?.name}
                        {r.from?.isVerified && <BadgeCheck size={16} color="#8b5cf6" fill="#8b5cf630" />}
                      </div>
                    </Link>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '2px', fontWeight: 500 }}>
                      {r.from?.role} {r.from?.company ? `• ${r.from.company}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isAccepted ? (
                      alreadyFollowing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem' }}>
                          <Check size={16} strokeWidth={3} /> Mutual
                        </div>
                      ) : (
                        <button onClick={() => handleRequestBack(r.from?._id, r._id)} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#6366f1' }}>
                          <UserPlus size={16} strokeWidth={2.5} /> Request Back
                        </button>
                      )
                    ) : (
                      <>
                        <button onClick={() => handleDeclineRequest(r._id)} className="btn-secondary" style={{ padding: '0.6rem', borderRadius: '12px', color: '#f43f5e', background: 'rgba(244,63,94,0.05)', border: 'none', transition: 'background 0.2s' }} title="Decline">
                          <X size={20} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleAcceptRequest(r._id)} className="btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                          <Check size={18} strokeWidth={3} /> Accept
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '16px', padding: '0.4rem' }}>
        {['posts', ...(profile?.role === 'founder' ? ['startups'] : ['investments'])].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', background: tab === t ? 'var(--bg-card)' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: tab === t ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
            {t === 'posts' ? '📝 Activity' : t === 'startups' ? '🚀 Portfolio' : '💼 Track Record'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {tab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {posts.length === 0 ? (
              <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <Grid size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <h3 style={{ fontWeight: 800, color: 'var(--text-muted)' }}>Nothing shared yet</h3>
              </div>
            ) : posts.map(p => <PostCard key={p._id} post={p} onUpdate={(u) => setPosts(prev => prev.map(x => x._id === u._id ? u : x))} onDelete={(id) => setPosts(prev => prev.filter(x => x._id !== id))} />)}
          </div>
        )}

        {tab === 'startups' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {startups.length === 0 ? (
              <div className="card" style={{ gridColumn: '1/-1', padding: '4rem 2rem', textAlign: 'center' }}>
                <Rocket size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <h3 style={{ fontWeight: 800, color: 'var(--text-muted)' }}>No startups built yet</h3>
                {isMe && <Link to="/startups/create"><button className="btn-primary" style={{ marginTop: '1.5rem' }}>Start Building</button></Link>}
              </div>
            ) : startups.map(s => (
              <Link key={s._id} to={`/startups/${s._id}`} style={{ textDecoration: 'none' }}>
                <div className="card nav-item" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  {s.logo ? (
                    <img src={`${s.logo}`} alt={`${s.title} logo`} style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 900, flexShrink: 0 }}>{s.title[0]}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{s.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '0.2rem' }}>{s.industry} • {s.stage}</div>
                  </div>
                  <span className={`badge ${s.isApproved ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>{s.isApproved ? 'LIVE' : 'PENDING'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'investments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!(profile?.pastInvestments?.filter(inv => inv.status === 'accepted')?.length) ? (
              <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <TrendingUp size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <h3 style={{ fontWeight: 800, color: 'var(--text-muted)' }}>No verified investments listed</h3>
                {isMe && (
                  <Link to="/my-investments">
                    <button className="btn-primary" style={{ marginTop: '1.5rem' }}>Manage Investments</button>
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {profile.pastInvestments.filter(inv => inv.status === 'accepted').map((inv, i) => {
                  const exitStyle = EXIT_STYLES[inv.exitStatus] || EXIT_STYLES.Active;
                  const roundColor = ROUND_COLORS[inv.round] || '#6366f1';
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedInvestment(inv)}
                      style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
                        transition: 'all 0.22s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${roundColor}22`; e.currentTarget.style.borderColor = `${roundColor}40`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      {/* Coloured top strip */}
                      <div style={{ height: '6px', background: `linear-gradient(90deg, ${roundColor}, ${exitStyle.color})` }} />

                      <div style={{ padding: '1.25rem' }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `linear-gradient(135deg, ${roundColor}20, ${exitStyle.color}20)`, border: `1px solid ${roundColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: roundColor, flexShrink: 0 }}>
                            {inv.companyName?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 900, fontSize: '1.05rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.companyName}</div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {inv.sector && <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>{inv.sector}</span>}
                              {inv.round && <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', background: `${roundColor}15`, color: roundColor, border: `1px solid ${roundColor}30` }}>{inv.round}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end', flexShrink: 0 }}>
                            <div style={{ padding: '0.25rem 0.6rem', borderRadius: '8px', background: exitStyle.bg, border: `1px solid ${exitStyle.border}`, color: exitStyle.color, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {inv.exitStatus}
                            </div>
                          </div>
                        </div>

                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={14} color="#10b981" />
                            <div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Amount</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>{inv.amount || 'Undisclosed'}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={14} color="#6366f1" />
                            <div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Year</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>{inv.year}</div>
                            </div>
                          </div>
                        </div>

                        {/* Click hint */}
                        <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                          <span>View Details</span>
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Investment Detail Modal */}
      {selectedInvestment && (
        <InvestmentDetailModal
          inv={selectedInvestment}
          investorName={profile?.name}
          investorAvatar={
            profile?.avatar
              ? `${profile.avatar}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'U')}&background=6366f1&color=fff&size=80`
          }
          onClose={() => setSelectedInvestment(null)}
        />
      )}

      {/* Followers/Following Modal */}
      {showModal && (
        <UserListModal 
          title={showModal === 'followers' ? 'Followers' : 'Following'} 
          users={showModal === 'followers' ? profile.followers : profile.following} 
          onClose={() => setShowModal(null)} 
          isOwnProfile={isMe}
          onRemoveFollower={handleRemoveFollower}
          onUnfollow={handleUnfollow}
        />
      )}
    </div>
  );
};

export default Profile;
