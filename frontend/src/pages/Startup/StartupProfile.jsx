import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Globe, MapPin, IndianRupee, Users, TrendingUp, Edit, 
  MessageCircle, Bookmark, Brain, Eye, Heart, ExternalLink, 
  Rocket, ChevronRight, ShieldCheck, FileText, Share2, DollarSign,
  TrendingDown, Zap, Target, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const INDUSTRY_COLORS = { 
  fintech:'#6366f1', 
  healthtech:'#10b981', 
  edtech:'#f59e0b', 
  saas:'#8b5cf6', 
  'ai-ml':'#06b6d4', 
  ecommerce:'#ec4899', 
  cleantech: '#14b8a6',
  logistics: '#f43f5e',
  'real-estate': '#8b5cf6',
  other:'#64748b' 
};

const StartupProfile = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offer, setOffer] = useState({ amount: '', message: '' });
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    fetchStartup();
  }, [id]);

  const fetchStartup = async () => {
    try {
      const { data } = await api.get(`/startups/${id}`);
      setStartup(data);
      setBookmarked(data.bookmarks?.includes(user?._id));
    } catch { 
      toast.error('Startup not found'); 
      navigate('/feed'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleBookmark = async () => {
    setBookmarked(p => !p);
    try { 
      await api.post(`/startups/${id}/bookmark`); 
    } catch { 
      setBookmarked(p => !p); 
    }
  };

  const handleMessage = async () => {
    try {
      const { data } = await api.post('/messages/conversations', { participantId: startup.founder._id });
      navigate(`/messages/${data._id}`);
    } catch { 
      toast.error('Could not open conversation'); 
    }
  };

  const handleOffer = async (e) => {
    e.preventDefault();
    if (!offer.amount) return toast.error('Enter an amount');
    setSubmittingOffer(true);
    try {
      await api.post(`/startups/${id}/offer`, { amount: Number(offer.amount), message: offer.message });
      toast.success('Investment offer sent!');
      setShowOfferModal(false);
      setOffer({ amount: '', message: '' });
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to send offer'); 
    } finally { 
      setSubmittingOffer(false); 
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: '50px', height: '50px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: '#6366f1' }}
      />
    </div>
  );
  
  if (!startup) return null;

  const isOwner = user?._id === startup.founder?._id;
  const isConnected = startup.isConnected;
  const indColor = INDUSTRY_COLORS[startup.industry] || '#6366f1';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '5rem' }}>
      {/* Header / Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ 
          padding: '0', 
          marginBottom: '2rem', 
          borderRadius: '32px', 
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ height: '200px', background: `linear-gradient(135deg, ${indColor} 0%, ${indColor}dd 100%)`, position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: '-40px', left: '40px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '28px', 
              background: 'var(--bg-card)', 
              padding: '8px', 
              boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
              border: '1px solid var(--border)'
            }}>
              {startup.logo ? (
                <img src={`${startup.logo}`} alt={startup.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '20px', background: `linear-gradient(135deg, ${indColor}, ${indColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 900 }}>
                  {startup.title[0]}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '60px 40px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{startup.title}</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge" style={{ background: `${indColor}15`, color: indColor, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>{startup.industry}</span>
                  <span className="badge badge-cyan" style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>{startup.stage}</span>
                  {startup.isApproved && <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 800, fontSize: '0.7rem' }}><ShieldCheck size={12} style={{marginRight: '2px'}}/> Verified</span>}
                </div>
              </div>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '700px' }}>{startup.tagline}</p>
              <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                {startup.location && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(startup.location)}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }} title="Open in Google Maps">
                    <MapPin size={16} /> {startup.location}
                  </a>
                )}
                {startup.website && <a href={startup.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', textDecoration: 'none' }}><Globe size={16} /> Website</a>}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Eye size={16} /> {startup.views} views</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {isOwner ? (
                <button onClick={() => navigate(`/startups/${id}/edit`)} className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}><Edit size={18} /> Edit Startup</button>
              ) : (
                <>
                  <button onClick={handleBookmark} className="btn-secondary" style={{ width: '48px', height: '48px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bookmark size={20} fill={bookmarked ? '#6366f1' : 'none'} color={bookmarked ? '#6366f1' : 'currentColor'} />
                  </button>
                  <button onClick={() => navigate(`/profile/${startup.founder._id}`)} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 800 }}>Connect & View Profile</button>
                  {isConnected && <button onClick={handleMessage} className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}><MessageCircle size={18} /> Message</button>}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        {/* Left Column: Details */}
        <div>
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingLeft: '1rem' }}>
            {['about', 'team', 'traction'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{ 
                  padding: '1rem 0.5rem', 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '1rem', 
                  fontWeight: 800, 
                  color: activeTab === tab ? '#6366f1' : 'var(--text-muted)',
                  borderBottom: activeTab === tab ? '3px solid #6366f1' : '3px solid transparent',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.3s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {!isConnected && user?.role === 'investor' ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="card" 
              style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '32px' }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                <Zap size={40} color="#6366f1" />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1rem' }}>Data Locked</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 2.5rem', lineHeight: 1.8, fontSize: '1.05rem' }}>
                Detailed metrics, financial data, and team depth are restricted to connected investors only. Connect with the founder to unlock.
              </p>
              <button onClick={() => navigate(`/profile/${startup.founder._id}`)} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', fontWeight: 900 }}>
                Request Full Access
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'about' && (
                <motion.div 
                  key="about"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                >
                  <div className="card" style={{ padding: '2.5rem', marginBottom: '1.5rem', borderRadius: '24px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>The Mission</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>{startup.description}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {startup.problem && (
                      <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(244,63,94,0.02)', border: '1px solid rgba(244,63,94,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          <div style={{ padding: '8px', background: 'rgba(244,63,94,0.1)', borderRadius: '10px' }}><Target size={20} color="#f43f5e" /></div>
                          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f43f5e' }}>Problem</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>{startup.problem}</p>
                      </div>
                    )}
                    {startup.solution && (
                      <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          <div style={{ padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px' }}><Zap size={20} color="#10b981" /></div>
                          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10b981' }}>Solution</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>{startup.solution}</p>
                      </div>
                    )}
                  </div>

                  {startup.images?.length > 0 && (
                    <div className="card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Gallery</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {startup.images.map((img, i) => (
                          <img key={i} src={`${img}`} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '16px', border: '1px solid var(--border)' }} alt="" />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'team' && (
                <motion.div 
                  key="team"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                >
                  <div className="card" style={{ padding: '2.5rem', borderRadius: '24px', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem' }}>Core Team</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                      {startup.teamMembers?.map((m, i) => (
                        <div key={i} style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border)' }}>
                          <div style={{ width: '70px', height: '70px', borderRadius: '24px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.5rem', margin: '0 auto 1.25rem', boxShadow: '0 10px 20px rgba(99,102,241,0.2)' }}>{m.name[0]}</div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{m.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '1rem' }}>{m.role}</div>
                          {m.linkedIn && (
                            <a href={m.linkedIn} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', background: 'var(--bg-card)', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, color: '#6366f1', textDecoration: 'none', border: '1px solid var(--border)' }}>
                              <ExternalLink size={14} /> Profile
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'traction' && (
                <motion.div 
                  key="traction"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                >
                  <div className="card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Performance Metrics</h3>
                      <div style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }}>Verified Data</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                      {[
                        { label: 'Revenue (ARR)', value: `₹${startup.traction?.revenue?.toLocaleString() || 0}`, icon: BarChart3, color: '#10b981' },
                        { label: 'Active Users', value: startup.traction?.users?.toLocaleString() || 0, icon: Users, color: '#6366f1' },
                        { label: 'MoM Growth', value: `${startup.traction?.growthRate || 0}%`, icon: TrendingUp, color: '#8b5cf6' },
                      ].map((m, i) => (
                        <div key={i} style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)' }}>
                          <div style={{ color: m.color, marginBottom: '0.75rem' }}><m.icon size={24} /></div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.25rem' }}>{m.value}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Right Column: Investment Card & Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Investment Card */}
          <div className="card" style={{ 
            padding: '2rem', 
            borderRadius: '28px', 
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
            color: 'white',
            border: 'none',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Investment Round</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Target Goal</div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>₹{((startup.fundingGoal || 0)/1000000).toFixed(1)}M</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Equity</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{startup.equity || 0}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Valuation</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>₹{((startup.valuation || 0)/1000000).toFixed(1)}M</div>
              </div>
            </div>

            {user?.role === 'investor' && !isOwner && (
              <button 
                onClick={() => setShowOfferModal(true)} 
                className="btn-primary" 
                style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 900, background: 'white', color: '#1e293b', border: 'none' }}
              >
                Send Investment Offer
              </button>
            )}
            
            {isOwner && (
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', textAlign: 'center', fontSize: '0.85rem' }}>
                <Link to="/billing" style={{ color: 'white', fontWeight: 700, textDecoration: 'underline' }}>Promote your Startup</Link>
              </div>
            )}
          </div>

          {/* Founder Profile Card */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '24px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Founded By</h3>
            <Link to={`/profile/${startup.founder?._id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <img src={startup.founder?.avatar ? `${startup.founder.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(startup.founder?.name||'F')}&background=6366f1&color=fff&size=48`} style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover' }} alt="" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{startup.founder?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>View Full Profile <ChevronRight size={12} /></div>
              </div>
            </Link>
          </div>

          {/* Quick Info */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pitch Deck</span>
                {isConnected ? (
                  (startup.verificationDocument || startup.pitchDeckUrl) ? (
                    <a href={`${startup.verificationDocument || startup.pitchDeckUrl}`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FileText size={16} /> View</a>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not Provided</span>
                  )
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔒 Locked</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Team Size</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 800 }}>{startup.teamMembers?.length || 0} Members</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Social</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied to clipboard!'); }} className="btn-ghost" style={{ padding: '5px' }} title="Copy Link"><Share2 size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Offer Modal */}
      <AnimatePresence>
        {showOfferModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }} 
            onClick={() => setShowOfferModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="card" 
              style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: '32px' }} 
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>Make an <span className="gradient-text">Offer</span></h3>
                <button onClick={() => setShowOfferModal(false)} className="btn-ghost"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleOffer} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.6rem' }}>Investment Amount (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <IndianRupee size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="number" value={offer.amount} onChange={e => setOffer(p => ({ ...p, amount: e.target.value }))} placeholder="5,00,000" className="input" style={{ paddingLeft: '2.75rem' }} required />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.6rem' }}>Personal Message</label>
                  <textarea value={offer.message} onChange={e => setOffer(p => ({ ...p, message: e.target.value }))} placeholder="Tell the founder why you're interested in NovaMed AI..." className="input textarea" style={{ minHeight: '120px' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowOfferModal(false)} className="btn-secondary" style={{ flex: 1, padding: '1rem' }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submittingOffer} style={{ flex: 1, padding: '1rem' }}>{submittingOffer ? 'Processing...' : 'Send Offer'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X = ({ size, ...props }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
const CreditCard = (props) => <div {...props} />; // Placeholder

export default StartupProfile;
