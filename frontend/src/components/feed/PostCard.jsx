import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Eye,
  Send, Trash2, ExternalLink, TrendingUp, UserPlus, Clock,
  BadgeCheck, ChevronDown, ChevronUp, UserCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';


const TYPE_META = {
  update:       { label: 'Update',       color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'   },
  milestone:    { label: 'Milestone',    color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  funding:      { label: 'Funding',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  funding_need: { label: 'Seeking',      color: '#f43f5e', bg: 'rgba(244,63,94,0.1)'   },
  hiring:       { label: 'Hiring',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)'  },
  product:      { label: 'Product',      color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
  investor_intro: { label: 'Intro',      color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  general:      { label: null,           color: null,      bg: null                     },
};

const PostCard = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(post.likes?.includes(user?._id));
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [saved, setSaved] = useState(post.saves?.includes(user?._id));
  const [showComment, setShowComment] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [localConnectStatus, setLocalConnectStatus] = useState('none');
  const navigate = useNavigate();

  // Compute initial connection status from post data
  const isAlreadyFollower = post.author?.followers?.some(
    f => (typeof f === 'string' ? f : f._id?.toString()) === user?._id?.toString()
  );
  const hasPendingRequest = post.author?.connectionRequests?.some(
    r => (r.from?.toString() || r.from?._id?.toString()) === user?._id?.toString() && r.status === 'pending'
  );
  // Derive the effective connect status (local overrides once user acts)
  const effectiveConnectStatus = localConnectStatus !== 'none'
    ? localConnectStatus
    : isAlreadyFollower
      ? 'connected'
      : hasPendingRequest
        ? 'pending'
        : 'none';

  const typeMeta = TYPE_META[post.type] || TYPE_META.general;

  const authorAvatarUrl = post.author?.avatar
    ? `http://localhost:1110${post.author.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'U')}&background=6366f1&color=fff&size=40`;

  const userAvatarUrl = user?.avatar
    ? `http://localhost:1110${user.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff`;

  const handleConnect = async (e, userId) => {
    e.stopPropagation();
    setConnectLoading(true);
    try {
      await api.post(`/auth/connect/${userId}`);
      setLocalConnectStatus('pending');
      toast.success('Connection request sent!');
    } catch (err) {
      const errMsg = err.response?.data?.error || '';
      if (errMsg.toLowerCase().includes('already connected')) {
        setLocalConnectStatus('connected');
        toast.success('You are already connected!');
      } else {
        toast.error(errMsg || 'Failed to send request');
      }
    } finally {
      setConnectLoading(false);
    }
  };

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes(p => wasLiked ? p - 1 : p + 1);
    try {
      await api.post(`/posts/${post._id}/like`);
    } catch {
      setLiked(wasLiked);
      setLikes(p => wasLiked ? p + 1 : p - 1);
    }
  };

  const handleSave = async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      await api.post(`/posts/${post._id}/save`);
      toast.success(wasSaved ? 'Removed from saved' : 'Saved to collection!');
    } catch {
      setSaved(wasSaved);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/comment`, { content: comment });
      const updated = { ...post, comments: [...(post.comments || []), data] };
      onUpdate(updated);
      setComment('');
      toast.success('Comment added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to comment');
    } finally { setSubmitting(false); }
  };

  const handleDelete = () => {
    setConfirmDelete(true);
    setShowMenu(false);
  };

  const proceedDelete = async () => {
    const loadingToast = toast.loading('Deleting post...');
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete(post._id);
      toast.success('Post deleted', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to delete post', { id: loadingToast });
    } finally {
      setConfirmDelete(false);
    }
  };

  const isOwner = user?._id === post.author?._id;
  const commentsToShow = showAllComments ? post.comments : post.comments?.slice(-2);

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '20px', overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.07)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '1.25rem 1.25rem 0.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Link to={`/profile/${post.author?._id}`} style={{ flexShrink: 0 }}>
            <img
              src={authorAvatarUrl}
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-secondary)', transition: 'border-color 0.2s' }}
              alt={post.author?.name}
            />
          </Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link
                to={`/profile/${post.author?._id}`}
                style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                {post.author?.name}
              </Link>
              {post.author?.isVerified && (
                <BadgeCheck size={16} color="#8b5cf6" fill="rgba(139,92,246,0.15)" />
              )}
              {typeMeta.label && (
                <span style={{
                  fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem',
                  borderRadius: '999px', background: typeMeta.bg, color: typeMeta.color,
                  border: `1px solid ${typeMeta.color}30`, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0
                }}>
                  {typeMeta.label}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '2px' }}>
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{post.author?.role}</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {/* Options menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowMenu(p => !p)}
            style={{
              padding: '0.4rem', borderRadius: '10px', border: 'none',
              background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <MoreHorizontal size={18} />
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 50,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '14px', padding: '0.4rem', minWidth: '170px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.15)', backdropFilter: 'blur(12px)'
            }}>
              {post.startup && (
                <button
                  onClick={() => { navigate(`/startups/${post.startup._id}`); setShowMenu(false); }}
                  style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <ExternalLink size={15} /> View Startup
                </button>
              )}
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); setShowMenu(false); }}
                style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Share2 size={15} /> Copy Link
              </button>
              {isOwner && (
                <button
                  onClick={handleDelete}
                  style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#f43f5e', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash2 size={15} /> Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Investor Portfolio Chip ── */}
      {!isOwner && post.author?.role === 'investor' && post.author?.pastInvestments?.length > 0 && (
        <div style={{ padding: '0 1.25rem 0.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px' }}>
            <TrendingUp size={13} color="#10b981" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Portfolio: <b style={{ color: 'var(--text-primary)' }}>{post.author.pastInvestments[0].companyName}</b>
              {post.author.pastInvestments.length > 1 && ` +${post.author.pastInvestments.length - 1}`}
            </span>
          </div>
        </div>
      )}

      {/* ── Startup Tag ── */}
      {post.startup && (
        <div style={{ padding: '0 1.25rem 0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to={`/startups/${post.startup._id}`} style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.35rem 0.75rem', borderRadius: '10px',
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
              color: '#818cf8', fontSize: '0.8rem', fontWeight: 700
            }}>
              🚀 {post.startup.title}
            </span>
          </Link>
          {post.startup.fundingGoal > 0 && (
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>
              ₹{(post.startup.fundingGoal / 1000000).toFixed(1)}M Goal
            </span>
          )}
        </div>
      )}

      {/* ── CTA Banners ── */}
      {post.type === 'funding_need' && user?.role === 'investor' && !isOwner && (
        <div style={{ margin: '0 1.25rem 1rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(244,63,94,0.02))', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#f43f5e', marginBottom: '0.2rem' }}>Funding Opportunity</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>This founder is actively seeking investment.</div>
          </div>
          {effectiveConnectStatus === 'connected' ? (
            <button disabled style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={14} /> Connected
            </button>
          ) : effectiveConnectStatus === 'pending' ? (
            <button disabled style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} /> Requested
            </button>
          ) : (
            <button onClick={(e) => handleConnect(e, post.author._id)} disabled={connectLoading} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: '#f43f5e', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {connectLoading ? '...' : <><UserPlus size={14} /> Connect</>}
            </button>
          )}
        </div>
      )}

      {post.type === 'investor_intro' && user?.role === 'founder' && !isOwner && (
        <div style={{ margin: '0 1.25rem 1rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#10b981', marginBottom: '0.2rem' }}>Active Investor</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Looking for promising startups to back.</div>
          </div>
          {effectiveConnectStatus === 'connected' ? (
            <button disabled style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={14} /> Connected
            </button>
          ) : effectiveConnectStatus === 'pending' ? (
            <button disabled style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} /> Requested
            </button>
          ) : (
            <button onClick={(e) => handleConnect(e, post.author._id)} disabled={connectLoading} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: '#10b981', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {connectLoading ? '...' : <><UserPlus size={14} /> Connect</>}
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ padding: '0.25rem 1.25rem 1rem' }}>
        <p style={{ lineHeight: 1.8, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', margin: 0 }}>
          {post.content}
        </p>
      </div>

      {/* ── Images ── */}
      {post.images?.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: post.images.length === 1 ? '1fr' : 'repeat(2, 1fr)',
          gap: '2px', marginBottom: '0.5rem', overflow: 'hidden'
        }}>
          {post.images.slice(0, 4).map((img, i) => (
            <img
              key={i}
              src={`http://localhost:1110${img}`}
              style={{ width: '100%', aspectRatio: post.images.length === 1 ? '16/9' : '1/1', objectFit: 'cover', maxHeight: '420px' }}
              alt=""
            />
          ))}
        </div>
      )}

      {/* ── Stats Row ── */}
      <div style={{ padding: '0.6rem 1.25rem', display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Eye size={13} /> {post.views || 0} views
        </span>
        <span>{likes} {likes === 1 ? 'like' : 'likes'}</span>
        <span>{post.comments?.length || 0} comment{post.comments?.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Actions Row ── */}
      <div style={{ padding: '0.25rem 0.75rem 0.25rem', display: 'flex', borderTop: '1px solid var(--border)' }}>
        {[
          {
            onClick: handleLike, active: liked, activeColor: '#f43f5e',
            icon: <Heart size={17} fill={liked ? '#f43f5e' : 'none'} />,
            label: liked ? 'Liked' : 'Like'
          },
          {
            onClick: () => setShowComment(p => !p), active: showComment, activeColor: '#6366f1',
            icon: <MessageCircle size={17} />,
            label: 'Comment'
          },
          {
            onClick: handleSave, active: saved, activeColor: '#818cf8',
            icon: <Bookmark size={17} fill={saved ? '#818cf8' : 'none'} />,
            label: saved ? 'Saved' : 'Save'
          },
        ].map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            style={{
              flex: 1, padding: '0.7rem 0.5rem', border: 'none', background: 'transparent',
              cursor: 'pointer', borderRadius: '12px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.45rem',
              fontSize: '0.85rem', fontWeight: 700,
              color: action.active ? action.activeColor : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = action.active ? action.activeColor : 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = action.active ? action.activeColor : 'var(--text-muted)'; }}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>

      {/* ── Comment Section ── */}
      {showComment && (
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}>

          {/* Existing comments */}
          {post.comments?.length > 0 && (
            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {post.comments.length > 2 && (
                <button
                  onClick={() => setShowAllComments(p => !p)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0', marginBottom: '0.25rem' }}
                >
                  {showAllComments ? <><ChevronUp size={14} /> Hide comments</> : <><ChevronDown size={14} /> View all {post.comments.length} comments</>}
                </button>
              )}
              {commentsToShow?.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                  <img
                    src={c.author?.avatar ? `http://localhost:1110${c.author.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author?.name || 'U')}&background=6366f1&color=fff`}
                    style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    alt=""
                  />
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px 12px 12px 4px', padding: '0.5rem 0.875rem', flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.2rem' }}>{c.author?.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            <img
              src={userAvatarUrl}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              alt=""
            />
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Write a comment..."
              style={{
                flex: 1, padding: '0.6rem 0.875rem',
                background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
                borderRadius: '12px', fontSize: '0.875rem', color: 'var(--text-primary)',
                outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              style={{
                padding: '0.6rem', borderRadius: '12px',
                background: comment.trim() ? '#6366f1' : 'var(--bg-secondary)',
                color: comment.trim() ? 'white' : 'var(--text-muted)',
                border: 'none', cursor: comment.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              background: 'rgba(10, 10, 15, 0.45)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{
                maxWidth: '420px',
                width: '100%',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
                borderRadius: '24px',
                padding: '2.25rem 2rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #f43f5e, #ec4899)'
              }} />

              {/* Pulsing deep warning alert icon */}
              <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.15)',
                  }}
                />
                
                <div style={{
                  position: 'absolute',
                  inset: '8px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 4px rgba(244, 63, 94, 0.05)'
                }}>
                  <Trash2 size={28} style={{ color: '#f43f5e', filter: 'drop-shadow(0 2px 4px rgba(244, 63, 94, 0.2))' }} />
                </div>
              </div>

              <h3 style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem',
                letterSpacing: '-0.02em',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
              }}>
                Delete Post?
              </h3>
              
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.925rem',
                lineHeight: 1.6,
                marginBottom: '1.75rem',
                padding: '0 0.5rem'
              }}>
                Are you sure you want to remove this post? This action is permanent and it will be deleted from everyone's feed.
              </p>

              {/* Custom alert warning box */}
              <div style={{
                background: 'rgba(244, 63, 94, 0.04)',
                border: '1px dashed rgba(244, 63, 94, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  This action cannot be undone
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.875rem' }}>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'var(--bg-hover)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1,
                    padding: '0.8rem 1.25rem',
                    borderRadius: '14px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    background: 'linear-gradient(135deg, #ff4d6d 0%, #f43f5e 100%)',
                    boxShadow: '0 8px 24px rgba(244, 63, 94, 0.4)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={proceedDelete}
                  style={{
                    flex: 1,
                    padding: '0.8rem 1.25rem',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(244, 63, 94, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none'
                  }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PostCard;
