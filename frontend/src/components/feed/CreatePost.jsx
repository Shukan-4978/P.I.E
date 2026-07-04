import React, { useState, useRef } from 'react';
import { Image, X, Send, ChevronDown, Rocket, Globe, TrendingUp, Megaphone, Briefcase, Box, Users, Hash } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value: 'general',       label: 'General',        icon: Hash,       color: '#94a3b8' },
  { value: 'update',        label: 'Update',         icon: Megaphone,  color: '#06b6d4' },
  { value: 'milestone',     label: 'Milestone',      icon: TrendingUp, color: '#10b981' },
  { value: 'funding',       label: 'Funding',        icon: Briefcase,  color: '#f59e0b' },
  { value: 'funding_need',  label: 'Seeking Funds',  icon: Rocket,     color: '#f43f5e' },
  { value: 'hiring',        label: 'Hiring',         icon: Users,      color: '#8b5cf6' },
  { value: 'product',       label: 'Product',        icon: Box,        color: '#6366f1' },
  { value: 'investor_intro',label: 'Introduction',   icon: Globe,      color: '#10b981' },
];

const CreatePost = ({ onPostCreated, onCancel }) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [type, setType] = useState(user?.role === 'investor' ? 'investor_intro' : 'general');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startups, setStartups] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const fileRef = useRef();

  React.useEffect(() => {
    if (user?.role === 'founder') {
      api.get('/startups/my').then(res => {
        setStartups(res.data);
        if (res.data.length > 0) setSelectedStartup(res.data[0]._id);
      }).catch(console.error);
    }
  }, [user]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return toast.error('Post content is required');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      fd.append('type', type);
      if (selectedStartup) fd.append('startup', selectedStartup);
      images.forEach(img => fd.append('images', img));
      const { data } = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Post shared!');
      onPostCreated(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = POST_TYPES.find(t => t.value === type) || POST_TYPES[0];
  const SelectedIcon = selectedType.icon;
  const avatarUrl = user?.avatar
    ? `${user.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff&size=40`;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1.5px solid rgba(99,102,241,0.25)',
      borderRadius: '20px', padding: '1.5rem',
      boxShadow: '0 8px 32px rgba(99,102,241,0.08)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <img
          src={avatarUrl}
          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--bg-secondary)' }}
          alt=""
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.925rem', marginBottom: '0.5rem' }}>{user?.name}</div>

          {/* Type Picker + Startup Picker */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Post type dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowTypeMenu(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.3rem 0.7rem', borderRadius: '10px',
                  background: `${selectedType.color}15`, border: `1px solid ${selectedType.color}30`,
                  color: selectedType.color, fontSize: '0.8rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <SelectedIcon size={13} />
                {selectedType.label}
                <ChevronDown size={12} />
              </button>
              {showTypeMenu && (
                <div style={{
                  position: 'absolute', top: '110%', left: 0, zIndex: 100,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '0.4rem', minWidth: '180px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.15)'
                }}>
                  {POST_TYPES.map(pt => {
                    const PtIcon = pt.icon;
                    return (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => { setType(pt.value); setShowTypeMenu(false); }}
                        style={{
                          width: '100%', padding: '0.55rem 0.875rem', borderRadius: '10px',
                          border: 'none', background: type === pt.value ? `${pt.color}12` : 'transparent',
                          cursor: 'pointer', color: type === pt.value ? pt.color : 'var(--text-secondary)',
                          fontSize: '0.85rem', fontWeight: type === pt.value ? 800 : 600,
                          display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => { if (type !== pt.value) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                        onMouseLeave={e => { if (type !== pt.value) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <PtIcon size={14} style={{ color: pt.color }} />
                        {pt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Startup selector */}
            {startups.length > 0 && (
              <select
                value={selectedStartup}
                onChange={e => setSelectedStartup(e.target.value)}
                style={{
                  padding: '0.3rem 0.7rem', borderRadius: '10px',
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="">No Startup</option>
                {startups.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onCancel}
          style={{
            padding: '0.4rem', borderRadius: '10px', border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', transition: 'all 0.2s', flexShrink: 0
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.color = '#f43f5e'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <X size={17} />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={user?.role === 'investor'
          ? 'Tell founders about your investment focus, what sectors you love, and how you can add value...'
          : 'Share a startup update, milestone, funding news, or insight with the P.I.E community...'}
        style={{
          width: '100%', minHeight: '130px', padding: '0.875rem 1rem',
          background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
          borderRadius: '14px', fontSize: '0.95rem', color: 'var(--text-primary)',
          lineHeight: 1.7, resize: 'vertical', outline: 'none',
          fontFamily: 'inherit', marginBottom: '1rem', boxSizing: 'border-box',
          transition: 'border-color 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
        autoFocus
      />

      {/* Image Previews */}
      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {previews.map((src, i) => (
            <div key={i} style={{ position: 'relative', width: '84px', height: '84px' }}>
              <img
                src={src}
                style={{ width: '84px', height: '84px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border)' }}
                alt=""
              />
              <button
                onClick={() => removeImage(i)}
                style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#f43f5e', border: '2px solid var(--bg-card)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={11} color="white" />
              </button>
            </div>
          ))}
          {/* Add more button */}
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            style={{
              width: '84px', height: '84px', borderRadius: '12px',
              border: '2px dashed var(--border)', background: 'var(--bg-secondary)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
              color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#818cf8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Image size={18} /> Add
          </button>
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="file" ref={fileRef} onChange={handleImageSelect} accept="image/*" multiple style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            style={{
              padding: '0.5rem 0.875rem', borderRadius: '10px', border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
              fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Image size={16} /> Photo
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.78rem', fontWeight: 600,
            color: content.length > 1800 ? '#f43f5e' : content.length > 1500 ? '#f59e0b' : 'var(--text-muted)'
          }}>
            {content.length}/2000
          </span>
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: '12px',
              background: content.trim() && !loading ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-secondary)',
              color: content.trim() && !loading ? 'white' : 'var(--text-muted)',
              border: 'none', cursor: content.trim() && !loading ? 'pointer' : 'not-allowed',
              fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.2s', boxShadow: content.trim() && !loading ? '0 6px 20px rgba(99,102,241,0.3)' : 'none'
            }}
          >
            <Send size={16} />
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
