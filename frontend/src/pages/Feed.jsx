import PieLoader from '../components/common/PieLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import { PlusCircle, Loader, Search, Rss, Flame, Clock, Sparkles } from 'lucide-react';
import api from '../services/api';
import PostCard from '../components/feed/PostCard';
import CreatePost from '../components/feed/CreatePost';
import useAuthStore from '../store/authStore';
import { getSocket } from '../lib/socket';

const Feed = ({ isComponent = false }) => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [suggested, setSuggested] = useState([]);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostCount, setNewPostCount] = useState(0);

  const fetchPosts = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const { data } = await api.get(`/posts/feed?page=${pageNum}&limit=10&search=${searchQuery}`);
      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    fetchPosts(1, true);
  }, [fetchPosts]);

  useEffect(() => {
    if (!isComponent) {
      api.get('/auth/suggested').then(res => setSuggested(res.data.slice(0, 4))).catch(console.error);
    }
    const socket = getSocket();
    socket.on('new_post', (post) => {
      if (post.author?._id !== user?._id) {
        setNewPostCount(c => c + 1);
      }
    });
    return () => socket.off('new_post');
  }, [user?._id, isComponent]);

  const loadMore = () => fetchPosts(page + 1);

  const handlePostCreated = (post) => {
    setPosts(prev => [post, ...prev]);
    setShowCreate(false);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const handleLoadNew = () => {
    setNewPostCount(0);
    fetchPosts(1, true);
  };

  const avatarUrl = user?.avatar
    ? `${user.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff&size=40`;

  if (loading) return <PieLoader />; } }`}</style>
    </div>
  );

  return (
    <div style={isComponent ? {} : { maxWidth: '720px', margin: '0 auto', paddingBottom: '4rem' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .feed-search:focus { outline: none; border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .create-prompt:hover { border-color: rgba(99,102,241,0.3) !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.08); }
        .new-posts-banner { animation: fadeSlideDown 0.3s ease; }
      `}</style>

      {!isComponent && (
        <>
          {/* Page Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}>
                  <Rss size={20} color="white" />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {user?.role === 'investor' ? 'Discover' : 'Feed'}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Live</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCreate(p => !p)}
                className="btn-primary"
                style={{ borderRadius: '14px', padding: '0.6rem 1.25rem', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}
              >
                <PlusCircle size={17} />
                {user?.role === 'investor' ? 'Post Intro' : 'New Post'}
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search posts, startups, or topics..."
                className="feed-search"
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem',
                  background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
                  borderRadius: '14px', fontSize: '0.9rem', color: 'var(--text-primary)',
                  transition: 'all 0.2s', boxSizing: 'border-box', outline: 'none'
                }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {/* New posts notification banner */}
      {newPostCount > 0 && (
        <button
          onClick={handleLoadNew}
          className="new-posts-banner"
          style={{
            width: '100%', padding: '0.75rem', marginBottom: '1rem',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
            border: '1px solid rgba(99,102,241,0.25)', borderRadius: '14px',
            color: '#818cf8', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={16} /> {newPostCount} new post{newPostCount > 1 ? 's' : ''} — Click to refresh
        </button>
      )}

      {/* Create Post */}
      {showCreate ? (
        <div style={{ marginBottom: '1.5rem', animation: 'fadeSlideDown 0.25s ease' }}>
          <CreatePost onPostCreated={handlePostCreated} onCancel={() => setShowCreate(false)} />
        </div>
      ) : (
        /* Quick Compose Prompt */
        <div
          className="create-prompt"
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1rem 1.25rem', marginBottom: '1.5rem',
            background: 'var(--bg-card)', border: '1.5px solid var(--border)',
            borderRadius: '18px', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <img
            src={avatarUrl}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--bg-secondary)' }}
            alt=""
          />
          <div style={{
            flex: 1, padding: '0.65rem 1rem', background: 'var(--bg-secondary)',
            borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500
          }}>
            {user?.role === 'investor' ? 'Introduce yourself to founders...' : 'Share a startup update or milestone...'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <div style={{ padding: '0.5rem 0.875rem', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', color: '#818cf8', fontSize: '0.8rem', fontWeight: 700 }}>
              Photo
            </div>
          </div>
        </div>
      )}

      {/* Feed Posts */}
      {posts.length === 0 ? (
        <div style={{
          padding: '4rem 2rem', textAlign: 'center',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '24px'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {search ? 'No posts found' : 'Nothing here yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto', lineHeight: 1.6, fontSize: '0.9rem' }}>
            {search
              ? `No results for "${search}". Try a different keyword.`
              : user?.role === 'founder'
                ? 'Share your first startup update to start building an audience.'
                : 'Follow founders to see their startup updates here.'}
          </p>
          {!search && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
              style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '14px' }}
            >
              <PlusCircle size={17} />
              {user?.role === 'investor' ? 'Post Introduction' : 'Create First Post'}
            </button>
          )}
        </div>
      ) : (
        <InfiniteScroll
          dataLength={posts.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', gap: '0.75rem' }}>
              <Loader size={20} color="#6366f1" style={{ animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Loading more...</span>
            </div>
          }
          endMessage={
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎉</div>
              You're all caught up!
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {posts.map(post => (
              <PostCard key={post._id} post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
            ))}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
};

export default Feed;
