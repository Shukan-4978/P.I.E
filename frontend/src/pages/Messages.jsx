import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Send, Phone, MoreVertical, ArrowLeft, Circle, Paperclip, 
  Image as ImageIcon, FileText, DollarSign, X, Download, 
  CheckCircle, MessageCircle, MoreHorizontal, User, ShieldCheck,
  TrendingUp, BarChart3, Rocket, Trash2, Search, Menu, ChevronLeft, ChevronRight, Lock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuthStore();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [showAttach, setShowAttach] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerData, setOfferData] = useState({ 
    amount: '', 
    equity: '', 
    startupId: '', 
    startupName: '', 
    instrument: 'SAFE Note', 
    valuation: '', 
    terms: '',
    isInstallmentPlan: false,
    installments: []
  });
  const [startups, setStartups] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingOffer, setPayingOffer] = useState(null);
  const [payingInstallmentId, setPayingInstallmentId] = useState(null);
  const [paymentSending, setPaymentSending] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [messagesToDelete, setMessagesToDelete] = useState([]);
  const [isSpecificDelete, setIsSpecificDelete] = useState(false);
  const [deleteSending, setDeleteSending] = useState(false);
  
  // New state for collapsible sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const filteredConversations = (conversations || []).filter(conv => {
    const other = conv.participants?.find(p => p._id?.toString() !== user?._id?.toString()) || conv.participants?.[0];
    if (!other) return false;
    return other.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const socket = getSocket();

  useEffect(() => {
    fetchConversations();
    socket.on('new_message', handleNewMessage);
    socket.on('offer_status_update', handleOfferUpdate);
    socket.on('user_typing', ({ userId }) => setTyping(true));
    socket.on('user_stop_typing', () => setTyping(false));
    socket.on('user_status', ({ userId, online }) => setOnlineUsers(p => ({ ...p, [userId]: online })));
    socket.on('messages_deleted', ({ messageIds }) => {
      setMessages(prev => prev.filter(m => !messageIds.includes(m._id)));
      setSelectedMessages(prev => prev.filter(id => !messageIds.includes(id)));
    });
    socket.on('offer_payment_update', ({ messageId, paymentStatus, installmentId }) => {
      setMessages(prev => prev.map(m => {
        if (m._id === messageId) {
          const newOfferData = { ...m.offerData, paymentStatus };
          if (installmentId && newOfferData.installments) {
            newOfferData.installments = newOfferData.installments.map(inst => 
              inst._id === installmentId ? { ...inst, status: 'paid', paidAt: new Date() } : inst
            );
          }
          return { ...m, offerData: newOfferData };
        }
        return m;
      }));
    });
    
    if (user?.role === 'founder') fetchMyStartups();

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('offer_status_update');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('user_status');
      socket.off('messages_deleted');
      socket.off('offer_payment_update');
    };
  }, []);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c._id === conversationId);
      if (conv) selectConversation(conv);
    }
  }, [conversationId, conversations]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data);
      setLoading(false);
    } catch (err) { setLoading(false); }
  };

  const fetchMyStartups = async () => {
    try {
      const { data } = await api.get('/startups/my');
      setStartups(data);
    } catch (e) {}
  };

  const selectConversation = async (conv) => {
    setSelectedMessages([]);
    if (activeConv) socket.emit('leave_conversation', activeConv._id);
    setActiveConv(conv);
    socket.emit('join_conversation', conv._id);
    if (conversationId !== conv._id) {
      navigate(`/messages/${conv._id}`, { replace: true });
    }
    try {
      const { data } = await api.get(`/messages/conversations/${conv._id}/messages`);
      setMessages(data);
    } catch (err) { toast.error('Failed to load messages'); }
    
    // Auto-collapse sidebar on mobile/small screens when selecting a chat
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleNewMessage = (msg) => {
    if (activeConv?._id === msg.conversation) {
      setMessages(prev => [...prev, msg]);
    }
    fetchConversations();
  };

  const handleOfferUpdate = ({ messageId, status }) => {
    setMessages(prev => prev.map(m => m._id === messageId ? { ...m, offerData: { ...m.offerData, status } } : m));
  };

  const toggleSelection = (msg) => {
    // Only allow selecting own messages for deletion (consistent with backend)
    const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
    if (!isMe) return;

    setSelectedMessages(prev => 
      prev.includes(msg._id) ? prev.filter(id => id !== msg._id) : [...prev, msg._id]
    );
  };

  const handleDeleteSelected = (specificId = null) => {
    const isSpecific = specificId && typeof specificId === 'string';
    const idsToDelete = isSpecific ? [specificId] : selectedMessages;
    if (idsToDelete.length === 0) return;
    
    setMessagesToDelete(idsToDelete);
    setIsSpecificDelete(isSpecific);
    setShowDeleteConfirmModal(true);
  };

  const executeDeleteMessages = async () => {
    setDeleteSending(true);
    const loadingToast = toast.loading(messagesToDelete.length === 1 ? 'Deleting message...' : 'Deleting messages...');
    try {
      await api.post(`/messages/conversations/${activeConv._id}/messages/delete`, { messageIds: messagesToDelete });
      toast.success(messagesToDelete.length === 1 ? 'Message deleted' : 'Messages deleted', { id: loadingToast });
      setMessages(prev => prev.filter(m => !messagesToDelete.includes(m._id)));
      if (isSpecificDelete) {
        setSelectedMessages(prev => prev.filter(id => !messagesToDelete.includes(id)));
      } else {
        setSelectedMessages([]);
      }
      setShowDeleteConfirmModal(false);
      setMessagesToDelete([]);
      fetchConversations();
    } catch (err) {
      toast.error('Failed to delete', { id: loadingToast });
    } finally {
      setDeleteSending(false);
    }
  };

  const handleSend = async (e, type = 'text', payload = null) => {
    if (e) e.preventDefault();
    if (type === 'text' && !text.trim()) return;
    if (!activeConv || sending) return;

    setSending(true);
    try {
      const body = { type, content: text };
      if (type === 'text') body.content = text;
      if (type === 'offer') {
        body.type = 'offer';
        body.content = `Investment Offer: ₹${Number(payload.amount).toLocaleString('en-IN')} for ${payload.equity}% equity`;
        body.offerData = { ...payload, amount: Number(payload.amount), equity: Number(payload.equity) };
      }
      if (type === 'image' || type === 'file') {
        body.type = type;
        body.content = `Sent a ${type}`;
        body.attachments = [payload];
      }

      const { data } = await api.post(`/messages/conversations/${activeConv._id}/messages`, body);
      setMessages(prev => [...prev, data]);
      if (type === 'text') setText('');
      fetchConversations();
    } catch (err) { toast.error('Failed to send'); }
    finally { setSending(false); setShowAttach(false); setShowOfferModal(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const loadingToast = toast.loading('Uploading file...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/messages/upload', formData);
      
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      handleSend(null, type, data);
      toast.success('File sent', { id: loadingToast });
    } catch (err) {
      toast.error('Upload failed', { id: loadingToast });
    }
  };

  const handleOfferStatus = async (msgId, status) => {
    try {
      await api.put(`/messages/offers/${msgId}/status`, { status });
      toast.success(`Offer ${status}!`);
      handleOfferUpdate({ messageId: msgId, status });
    } catch (err) { toast.error('Action failed'); }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSendInvestment = async (installmentId = null) => {
    if (!payingOffer) return;
    setPayingInstallmentId(installmentId);
    setPaymentSending(true);
    try {
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
      }

      const { data: order } = await api.post('/payments/send-investment-order', { 
        messageId: payingOffer._id,
        installmentId
      });
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "P.I.E Platform",
        description: installmentId 
          ? `Installment Payment for ${payingOffer.offerData?.startupName || 'Startup'}`
          : `Investment for ${payingOffer.offerData?.startupName || 'Startup'}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const { data } = await api.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              messageId: payingOffer._id,
              installmentId
            });
            
            if (data.success) {
              toast.success('Payment successful!');
              setMessages(prev => prev.map(m => {
                if (m._id === payingOffer._id) {
                  const updatedOffer = { ...m.offerData, paymentStatus: data.paymentStatus || (installmentId ? 'partially_paid' : 'sent') };
                  if (installmentId && updatedOffer.installments) {
                    updatedOffer.installments = updatedOffer.installments.map(inst => 
                      inst._id === installmentId ? { ...inst, status: 'paid', paidAt: new Date() } : inst
                    );
                    // Check if all paid
                    if (updatedOffer.installments.every(i => i.status === 'paid')) updatedOffer.paymentStatus = 'sent';
                  } else {
                    updatedOffer.paymentStatus = 'sent';
                  }
                  return { ...m, offerData: updatedOffer };
                }
                return m;
              }));
              setShowPaymentModal(false);
              setPayingOffer(null);
              setPayingInstallmentId(null);
            }
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: "#10b981" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaymentSending(false);
      // We don't clear payingInstallmentId here so the UI doesn't flicker while Razorpay is open
    }
  };

  const getOtherUser = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find(p => p._id?.toString() !== user?._id?.toString()) || conv.participants[0];
  };

  // —— FREE PLAN LOCK GATE ——
  const isFree = false; // !user?.subscriptionPlan || user?.subscriptionPlan === 'free';
  if (isFree) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 100px)', background: 'var(--bg-card)', borderRadius: '28px', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
        `}</style>
        {/* Background glow orbs */}
        <div style={{ position:'absolute', top:'10%', left:'20%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.08),transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'10%', right:'20%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.07),transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }} />

        <div style={{ textAlign:'center', maxWidth:460, padding:'2rem', position:'relative', zIndex:1 }}>
          {/* Animated lock icon */}
          <div style={{ width:100, height:100, borderRadius:'28px', background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 2rem', animation:'float 3s ease-in-out infinite', boxShadow:'0 20px 40px rgba(99,102,241,0.15)' }}>
            <Lock size={44} color="#6366f1" strokeWidth={1.5} />
          </div>

          <h2 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-0.03em', marginBottom:'0.75rem' }}>
            Messaging is <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>PIE Plus</span>
          </h2>
          <p style={{ color:'var(--text-secondary)', fontSize:'1rem', lineHeight:1.75, marginBottom:'2rem', maxWidth:340, margin:'0 auto 2rem' }}>
            Upgrade to <strong>PIE Plus</strong> or higher to unlock direct messaging with founders and investors on the platform.
          </p>

          {/* Feature chips */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.625rem', justifyContent:'center', marginBottom:'2.5rem' }}>
            {[
              { label:'10 messages/day', plan:'Plus', color:'#10b981' },
              { label:'50 messages/day', plan:'Pro', color:'#6366f1' },
              { label:'Unlimited', plan:'Premium', color:'#8b5cf6' },
            ].map(f => (
              <div key={f.label} style={{ padding:'0.4rem 0.875rem', borderRadius:'999px', background:`${f.color}10`, border:`1px solid ${f.color}30`, fontSize:'0.8rem', fontWeight:800, color:f.color }}>
                {f.plan}: {f.label}
              </div>
            ))}
          </div>

          <Link to="/billing">
            <button style={{ padding:'0.9rem 2.5rem', borderRadius:'16px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', cursor:'pointer', fontWeight:800, fontSize:'1rem', boxShadow:'0 12px 32px rgba(99,102,241,0.35)', transition:'all 0.2s', display:'inline-flex', alignItems:'center', gap:'0.6rem' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(99,102,241,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 12px 32px rgba(99,102,241,0.35)'; }}
            >
              <Lock size={18} /> Upgrade to PIE Plus
            </button>
          </Link>

          <p style={{ marginTop:'1.25rem', fontSize:'0.8rem', color:'var(--text-muted)' }}>
            Starting at just <strong style={{ color:'var(--text-primary)' }}>₹51/month</strong> · Cancel anytime
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 0, background: 'var(--bg-card)', borderRadius: '28px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 24px 64px -12px rgba(99,102,241,0.08)' }}>
      <style>{`
        .conv-item { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; border-radius: 16px; margin: 0 0.75rem 0.5rem; }
        .conv-item:hover { background: rgba(255,255,255,0.03); transform: translateX(4px); }
        .conv-item.active { background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05)); box-shadow: 0 4px 16px rgba(0,0,0,0.03); border: 1px solid rgba(99,102,241,0.1); }
        
        .msg-bubble { position: relative; transition: all 0.2s; }
        .msg-bubble:hover .msg-actions { opacity: 1; }
        .msg-actions { opacity: 0; position: absolute; top: -20px; right: 0; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 2px 8px; display: flex; gap: 8px; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        
        .attach-btn { transition: all 0.2s; border-radius: 12px; }
        .attach-btn:hover { background: rgba(99,102,241,0.1); color: #6366f1; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .glass-search {
          background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border); border-radius: 16px; display: flex; align-items: center; gap: 0.5rem;
          padding: 0 1rem; transition: all 0.3s ease; height: 44px; box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        .glass-search:focus-within { border-color: rgba(99,102,241,0.4); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .glass-search input { background: transparent; border: none; outline: none; font-size: 0.85rem; color: var(--text-primary); width: 100%; font-family: 'Inter', sans-serif; }
        
        .floating-input-wrapper {
          background: rgba(255,255,255,0.02); backdrop-filter: blur(12px); border: 1px solid var(--border);
          border-radius: 24px; padding: 0.5rem 0.75rem; display: flex; gap: 0.75rem; alignItems: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.04);
        }

        .hero-mesh {
          position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--bg-card); display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .hero-mesh::before {
          content:''; position:absolute; top:-50%; left:-20%; width:100%; height:200%;
          background: radial-gradient(circle at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 50%);
          animation: pulse-mesh 10s ease-in-out infinite alternate; pointer-events:none;
        }
        .hero-mesh::after {
          content:''; position:absolute; bottom:-50%; right:-20%; width:100%; height:200%;
          background: radial-gradient(circle at 50% 50%, rgba(168,85,247,0.06) 0%, transparent 50%);
          animation: pulse-mesh 12s ease-in-out infinite alternate-reverse; pointer-events:none;
        }
        @keyframes pulse-mesh {
          0% { transform: scale(1) translate(0,0); }
          100% { transform: scale(1.1) translate(5%, 5%); }
        }
      `}</style>

      {/* Collapsible Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', flexShrink: 0, overflow: 'hidden' }}
          >
            <div style={{ padding: '1.5rem', width: '340px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Messages
                </h2>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="btn-ghost" style={{ padding: '8px', borderRadius: '12px' }}><MoreHorizontal size={18} /></button>
                  <button onClick={() => setIsSidebarOpen(false)} className="btn-ghost" style={{ padding: '8px', borderRadius: '12px' }} title="Collapse sidebar">
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
              <div className="glass-search">
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search chats..." 
                />
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, width: '340px' }} className="no-scrollbar">
              {loading ? (
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '16px' }} />)}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(99,102,241,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <MessageCircle size={32} color="#6366f1" style={{ opacity: 0.5 }} />
                  </div>
                  <p style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{searchQuery ? 'No results found' : 'Inbox is empty'}</p>
                  <p style={{ fontSize: '0.85rem' }}>{searchQuery ? 'Try a different search term' : 'Connect with founders to start chatting.'}</p>
                </div>
              ) : filteredConversations.map(conv => {
                const other = getOtherUser(conv);
                const isOnline = onlineUsers[other?._id] ?? false;
                const isActive = activeConv?._id === conv._id;
                const unreadCount = conv.unreadCounts?.[user?._id] || 0;
                
                return (
                  <div key={conv._id} onClick={() => selectConversation(conv)} className={`conv-item ${isActive ? 'active' : ''}`} style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={other?.avatar ? `http://localhost:5000${other.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'U')}&background=6366f1&color=fff&size=48`} style={{ width: '48px', height: '48px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} alt="" />
                      {isOnline && <span style={{ position: 'absolute', bottom: -2, right: -2, width: '14px', height: '14px', background: '#10b981', borderRadius: '50%', border: '3px solid var(--bg-secondary)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other?.name || 'Unknown User'}</div>
                        {conv.lastMessage?.createdAt && (
                          <div style={{ fontSize: '0.7rem', color: unreadCount > 0 ? '#6366f1' : 'var(--text-muted)', fontWeight: unreadCount > 0 ? 800 : 600, flexShrink: 0 }}>
                            {(() => {
                              try {
                                return formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })
                                  .replace('about ', '')
                                  .replace('less than a minute', 'now');
                              } catch (e) { return 'recently'; }
                            })()}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '0.85rem', color: unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: unreadCount > 0 ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                          {conv.lastMessage?.sender?._id === user?._id || conv.lastMessage?.sender === user?._id ? <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>You:</span> : null}
                          {conv.lastMessage?.content || 'New conversation'}
                        </div>
                        {unreadCount > 0 && (
                          <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: '0.65rem', fontWeight: 900, minWidth: '20px', height: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>{unreadCount}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat area */}
      {activeConv ? (() => {
        const other = getOtherUser(activeConv);
        const isOnline = onlineUsers[other?._id];
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
            
            {/* Glassmorphic Header */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(16px)', zIndex: 10, boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                {!isSidebarOpen && (
                  <button onClick={() => setIsSidebarOpen(true)} className="btn-ghost" style={{ padding: '8px', borderRadius: '12px', background: 'rgba(99,102,241,0.05)' }}>
                    <Menu size={20} color="#6366f1" />
                  </button>
                )}
                <div style={{ position: 'relative' }}>
                  <img src={other?.avatar ? `http://localhost:5000${other.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'U')}&background=6366f1&color=fff&size=48`} style={{ width: '48px', height: '48px', borderRadius: '16px', objectFit: 'cover' }} alt="" />
                  {isOnline && <span style={{ position: 'absolute', bottom: -2, right: -2, width: '14px', height: '14px', background: '#10b981', borderRadius: '50%', border: '3px solid var(--bg-card)' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {other?.name} {other?.isVerified && <ShieldCheck size={16} color="#6366f1" />}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: isOnline ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                    {isOnline ? 'Online now' : (() => {
                      try {
                        return other?.lastSeen 
                          ? `Active ${formatDistanceToNow(new Date(other.lastSeen), { addSuffix: true })}` 
                          : 'Active recently';
                      } catch (e) { return 'Active recently'; }
                    })()}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <AnimatePresence>
                  {selectedMessages.length > 0 && (
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      whileHover={{ 
                        scale: 1.03, 
                        background: 'rgba(244, 63, 94, 0.12)', 
                        borderColor: 'rgba(244, 63, 94, 0.5)',
                        boxShadow: '0 8px 20px rgba(244, 63, 94, 0.15)' 
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleDeleteSelected}
                      style={{ 
                        padding: '0.6rem 1.1rem', 
                        color: '#f43f5e', 
                        border: '1px solid rgba(244, 63, 94, 0.3)', 
                        background: 'rgba(244, 63, 94, 0.06)', 
                        borderRadius: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(244,63,94,0.05)',
                        outline: 'none',
                        userSelect: 'none'
                      }}
                    >
                      <Trash2 size={15} style={{ filter: 'drop-shadow(0 2px 4px rgba(244, 63, 94, 0.25))' }} />
                      Delete ({selectedMessages.length})
                    </motion.button>
                  )}
                </AnimatePresence>
                <button onClick={() => setShowOfferModal(true)} className="btn-primary" style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #a855f7, #7e22ce)', borderRadius: '14px', boxShadow: '0 8px 24px rgba(168,85,247,0.3)' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>₹</span> {user?.role === 'founder' ? 'Send Proposal' : 'Make Offer'}
                </button>
                <button className="btn-ghost" style={{ padding: '10px', borderRadius: '14px' }}><Phone size={20} /></button>
                <button className="btn-ghost" style={{ padding: '10px', borderRadius: '14px' }}><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="no-scrollbar">
              <style>{`.msg-row:hover .msg-checkbox-wrapper { opacity: 1 !important; }`}</style>
              {messages.map((msg, i) => {
                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                const isSelected = selectedMessages.includes(msg._id);
                return (
                  <div key={msg._id || i} className="msg-row" style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '1rem', alignItems: 'flex-end', transition: '0.2s', background: isSelected ? 'rgba(244,63,94,0.05)' : 'transparent', padding: isSelected ? '8px' : '0', borderRadius: '16px' }}>
                    {!isMe && <img src={other?.avatar ? `http://localhost:5000${other.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'U')}&background=6366f1&color=fff`} style={{ width: '36px', height: '36px', borderRadius: '12px', marginBottom: '4px', objectFit: 'cover' }} alt="" />}
                    
                    {isMe && (
                      <div className="msg-checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', opacity: isSelected || selectedMessages.length > 0 ? 1 : 0, transition: '0.2s', paddingBottom: '0.5rem' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(msg)} style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#f43f5e' }} />
                      </div>
                    )}

                    <div style={{ maxWidth: '75%', minWidth: msg.type === 'offer' ? '320px' : '0', position: 'relative' }} className="msg-bubble">
                      {isMe && !isSelected && selectedMessages.length === 0 && (
                        <div className="msg-actions" style={{ top: '-24px' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSelected(msg._id); }} 
                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            title="Delete for everyone"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleSelection(msg); }} 
                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            title="Select"
                          >
                            <CheckCircle size={14} />
                          </button>
                        </div>
                      )}
                      <AnimatePresence>
                        {msg.type === 'text' && (
                          <div style={{ padding: '0.85rem 1.25rem', borderRadius: isMe ? '24px 24px 6px 24px' : '24px 24px 24px 6px', background: isMe ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--bg-secondary)', color: isMe ? 'white' : 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, boxShadow: isMe ? '0 8px 24px rgba(99,102,241,0.2)' : '0 4px 16px rgba(0,0,0,0.02)', border: isMe ? 'none' : '1px solid var(--border)' }}>{msg.content}</div>
                        )}
                        {msg.type === 'image' && (
                          <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-secondary)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
                            <img src={`http://localhost:5000${msg.attachments?.[0]?.url}`} style={{ maxWidth: '100%', maxHeight: '350px', display: 'block', cursor: 'pointer' }} alt="Attachment" onClick={() => window.open(`http://localhost:5000${msg.attachments?.[0]?.url}`)} />
                          </div>
                        )}
                        {msg.type === 'file' && (
                          <div style={{ padding: '1rem', borderRadius: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: '44px', height: '44px', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}><FileText size={22} /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.attachments?.[0]?.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(msg.attachments?.[0]?.size / 1024 / 1024).toFixed(2)} MB</div>
                            </div>
                            <a href={`http://localhost:5000${msg.attachments?.[0]?.url}`} download className="btn-ghost" style={{ padding: '10px', borderRadius: '12px' }}><Download size={20} /></a>
                          </div>
                        )}
                        {msg.type === 'offer' && (
                          <div style={{ padding: '0', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 12px 32px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(126,34,206,0.05))', borderBottom: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #a855f7, #7e22ce)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: 'white', boxShadow: '0 8px 20px rgba(168,85,247,0.3)' }}>₹</div>
                                <div>
                                  <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.02em', color: 'var(--text-primary)' }}>OFFICIAL PROPOSAL</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sent via P.I.E Secure</div>
                                </div>
                              </div>
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '6px' }}>INVESTMENT AMOUNT</div>
                                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>₹{Number(msg.offerData?.amount || 0).toLocaleString('en-IN')}</div>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '6px' }}>EQUITY OFFERED</div>
                                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{msg.offerData?.equity}%</div>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border)' }}>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '4px' }}>INSTRUMENT</div>
                                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{msg.offerData?.instrument || 'SAFE Note'}</div>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border)' }}>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '4px' }}>VALUATION CAP</div>
                                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{msg.offerData?.valuation ? `₹${Number(msg.offerData.valuation).toLocaleString('en-IN')}` : 'Uncapped'}</div>
                                </div>
                              </div>

                              <div style={{ background: 'rgba(168,85,247,0.05)', borderRadius: '14px', padding: '1rem', border: '1px solid rgba(168,85,247,0.15)', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Rocket size={16} color="#a855f7" /> Targeting: {msg.offerData?.startupName || 'Growth'}
                                </div>
                                {msg.offerData?.terms && (
                                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(168,85,247,0.1)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Terms:</strong> {msg.offerData.terms}
                                  </div>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                                {msg.offerData?.status === 'pending' ? (
                                  !isMe ? (
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                      <button onClick={() => handleOfferStatus(msg._id, 'accepted')} className="btn-primary" style={{ flex: 1, background: '#10b981', border: 'none', height: '46px', borderRadius: '14px', color: 'white', fontWeight: 800, boxShadow: '0 8px 20px rgba(16,185,129,0.2)' }}>Accept Deal</button>
                                      <button onClick={() => handleOfferStatus(msg._id, 'declined')} className="btn-secondary" style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', height: '46px', borderRadius: '14px', fontWeight: 700 }}>Decline</button>
                                    </div>
                                  ) : (
                                    <div style={{ width: '100%', textAlign: 'center', padding: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-muted)', borderRadius: '14px', fontWeight: 700, fontSize: '0.9rem', border: '1px dashed var(--border)' }}>Waiting for response...</div>
                                  )
                                ) : msg.offerData?.status === 'accepted' ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ width: '100%', textAlign: 'center', padding: '0.85rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                      <CheckCircle size={18} /> Offer Accepted
                                    </div>
                                    {user?.role === 'investor' && (
                                      msg.offerData?.paymentStatus === 'sent' ? (
                                        <div style={{ width: '100%', textAlign: 'center', padding: '0.85rem', background: 'rgba(168,85,247,0.1)', color: '#a855f7', borderRadius: '14px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(168,85,247,0.2)' }}>
                                          💸 Deal Fully Funded
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => { setPayingOffer(msg); setShowPaymentModal(true); }}
                                          style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 8px 24px rgba(16,185,129,0.3)', transition: 'transform 0.2s' }}
                                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                                        >
                                          <span style={{ fontSize: '1.2rem' }}>₹</span> {msg.offerData?.paymentStatus === 'partially_paid' ? 'Continue Payments' : 'Initiate Payment'}
                                        </button>
                                      )
                                    )}
                                    {user?.role === 'founder' && (msg.offerData?.paymentStatus === 'sent' || msg.offerData?.paymentStatus === 'partially_paid') && (
                                      <div style={{ width: '100%', textAlign: 'center', padding: '0.85rem', background: 'rgba(168,85,247,0.1)', color: '#a855f7', borderRadius: '14px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(168,85,247,0.2)' }}>
                                        💸 {msg.offerData?.paymentStatus === 'sent' ? 'Payment Received' : 'Partial Payment Received'}
                                      </div>
                                    )}
                                    
                                    {/* Installment Schedule Display */}
                                    {msg.offerData?.isInstallmentPlan && (
                                      <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Installment Schedule</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                          {msg.offerData.installments.map((inst, idx) => (
                                            <div key={inst._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {inst.status === 'paid' ? <CheckCircle size={14} color="#10b981" /> : <Circle size={14} color="var(--text-muted)" />}
                                                <span style={{ fontWeight: 600 }}>₹{Number(inst.amount).toLocaleString('en-IN')}</span>
                                              </div>
                                              <div style={{ color: inst.status === 'paid' ? '#10b981' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                {inst.status === 'paid' 
                                                  ? `Paid ${inst.paidAt ? format(new Date(inst.paidAt), 'MMM d') : 'N/A'}` 
                                                  : `Due ${inst.dueDate ? format(new Date(inst.dueDate), 'MMM d') : 'N/A'}`
                                                }
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ width: '100%', textAlign: 'center', padding: '0.85rem', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', borderRadius: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(244,63,94,0.2)' }}>
                                    <X size={18} /> Offer Declined
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </AnimatePresence>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '6px', fontWeight: 600 }}>
                        {(() => {
                          try {
                            return msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : '';
                          } catch (e) { return ''; }
                        })()}
                        {isMe && <CheckCircle size={12} color={msg.read ? '#6366f1' : 'var(--text-muted)'} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating Input Area */}
            <div style={{ padding: '0 2rem 1.5rem', position: 'relative' }}>
              {showAttach && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} style={{ position: 'absolute', bottom: '100%', left: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1rem', display: 'flex', gap: '1.25rem', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', marginBottom: '1rem', zIndex: 100 }}>
                  <button onClick={() => fileInputRef.current.click()} className="attach-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer' }}>
                    <div style={{ background: 'rgba(99,102,241,0.1)', padding: '12px', borderRadius: '14px', color: '#6366f1' }}><ImageIcon size={24} /></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Image</span>
                  </button>
                  <button onClick={() => fileInputRef.current.click()} className="attach-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer' }}>
                    <div style={{ background: 'rgba(168,85,247,0.1)', padding: '12px', borderRadius: '14px', color: '#a855f7' }}><FileText size={24} /></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Document</span>
                  </button>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                </motion.div>
              )}
              
              <div className="floating-input-wrapper">
                <button type="button" onClick={() => setShowAttach(!showAttach)} className="btn-ghost" style={{ padding: '12px', borderRadius: '16px', color: showAttach ? '#6366f1' : 'var(--text-muted)' }}>
                  <Paperclip size={22} />
                </button>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
                  <input value={text} onChange={e => setText(e.target.value)} placeholder="Type your message..." style={{ flex: 1, height: '48px', padding: '0 0.5rem', fontSize: '0.95rem', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }} />
                  <button type="submit" disabled={sending || !text.trim()} style={{ width: '44px', height: '44px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0, background: (!text.trim() && !sending) ? 'var(--bg-secondary)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', cursor: (!text.trim() && !sending) ? 'not-allowed' : 'pointer', color: (!text.trim() && !sending) ? 'var(--text-muted)' : 'white', transition: 'all 0.3s', boxShadow: (!text.trim() && !sending) ? 'none' : '0 8px 20px rgba(99,102,241,0.3)' }}>
                    <Send size={20} style={{ transform: 'translateX(-1px) translateY(1px)' }} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })() : (
        <div className="hero-mesh">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '120px', height: '120px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', boxShadow: '0 20px 40px rgba(99,102,241,0.1)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <MessageCircle size={56} style={{ color: '#6366f1', filter: 'drop-shadow(0 4px 8px rgba(99,102,241,0.3))' }} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>Select a Conversation</h2>
            <p style={{ maxWidth: '340px', margin: '0 auto', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Connect, negotiate, and close deals directly through P.I.E secure messaging.</p>
          </motion.div>
        </div>
      )}

      {/* Investment Offer Modal */}
      {showOfferModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '580px', borderRadius: '32px', padding: '2.5rem', border: '1px solid var(--border)', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem', letterSpacing: '-0.02em' }}>
                <span style={{ color: '#a855f7' }}>✨</span> {user?.role === 'founder' ? 'Send Proposal' : 'Investment Offer'}
              </h3>
              <button onClick={() => setShowOfferModal(false)} className="btn-ghost" style={{ padding: '8px', borderRadius: '12px' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Investment Amount (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontWeight: 900, fontSize: '1.1rem', color: '#a855f7' }}>₹</span>
                    <input type="number" style={{ width: '100%', height: '52px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '2.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', outline: 'none', transition: 'all 0.3s' }} placeholder="5,00,000" value={offerData.amount} onChange={e => setOfferData({...offerData, amount: e.target.value})} 
                    onFocus={e => {e.target.style.borderColor = '#a855f7'; e.target.style.boxShadow = '0 0 0 4px rgba(168,85,247,0.1)'}}
                    onBlur={e => {e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'}}
                    />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>* A 2% platform convenience fee will be added during payment.</div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Equity Asked (%)</label>
                  <div style={{ position: 'relative' }}>
                    <TrendingUp size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#a855f7' }} />
                    <input type="number" style={{ width: '100%', height: '52px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '2.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', outline: 'none', transition: 'all 0.3s' }} placeholder="5.5" value={offerData.equity} onChange={e => setOfferData({...offerData, equity: e.target.value})} 
                    onFocus={e => {e.target.style.borderColor = '#a855f7'; e.target.style.boxShadow = '0 0 0 4px rgba(168,85,247,0.1)'}}
                    onBlur={e => {e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'}}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Instrument</label>
                  <select style={{ width: '100%', height: '52px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '0 1rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer' }} value={offerData.instrument || 'SAFE Note'} onChange={e => setOfferData({...offerData, instrument: e.target.value})}>
                    <option value="SAFE Note">SAFE Note</option>
                    <option value="Priced Equity">Priced Equity</option>
                    <option value="Convertible Note">Convertible Note</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Valuation Cap (₹) - Optional</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontWeight: 900, fontSize: '1rem', color: '#a855f7' }}>₹</span>
                    <input type="number" style={{ width: '100%', height: '52px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '2.5rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', transition: 'all 0.3s' }} placeholder="5,00,00,000" value={offerData.valuation || ''} onChange={e => setOfferData({...offerData, valuation: e.target.value})} 
                    onFocus={e => {e.target.style.borderColor = '#a855f7'; e.target.style.boxShadow = '0 0 0 4px rgba(168,85,247,0.1)'}}
                    onBlur={e => {e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'}}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Target Startup</label>
                <div style={{ position: 'relative' }}>
                  <Rocket size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#a855f7' }} />
                  <input type="text" style={{ width: '100%', height: '52px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '2.5rem', fontSize: '0.95rem', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.3s' }} placeholder="Enter startup name" value={offerData.startupName} onChange={e => setOfferData({...offerData, startupName: e.target.value})} 
                  onFocus={e => {e.target.style.borderColor = '#a855f7'; e.target.style.boxShadow = '0 0 0 4px rgba(168,85,247,0.1)'}}
                  onBlur={e => {e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'}}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Additional Terms (Optional)</label>
                <textarea style={{ width: '100%', height: '80px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1rem', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.3s', resize: 'none' }} placeholder="Pro-rata rights, board seat expectations..." value={offerData.terms || ''} onChange={e => setOfferData({...offerData, terms: e.target.value})} 
                onFocus={e => {e.target.style.borderColor = '#a855f7'; e.target.style.boxShadow = '0 0 0 4px rgba(168,85,247,0.1)'}}
                onBlur={e => {e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'}}
                />
              </div>
              
              <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={18} color="#a855f7" /> Enable Installment Plan
                  </label>
                  <div 
                    onClick={() => {
                      const enabled = !offerData.isInstallmentPlan;
                      setOfferData({
                        ...offerData, 
                        isInstallmentPlan: enabled,
                        installments: enabled ? [{ amount: offerData.amount || '', dueDate: format(new Date(), 'yyyy-MM-dd') }] : []
                      });
                    }}
                    style={{ width: '52px', height: '28px', background: offerData.isInstallmentPlan ? '#a855f7' : 'var(--border)', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                  >
                    <div style={{ position: 'absolute', top: '4px', left: offerData.isInstallmentPlan ? '28px' : '4px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: '0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>

                {offerData.isInstallmentPlan && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {offerData.installments.map((inst, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>₹</span>
                          <input 
                            type="number" 
                            placeholder="Amount" 
                            value={inst.amount} 
                            onChange={e => {
                              const newInst = [...offerData.installments];
                              newInst[idx].amount = e.target.value;
                              setOfferData({...offerData, installments: newInst});
                            }}
                            style={{ width: '100%', height: '40px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', paddingLeft: '1.75rem', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </div>
                        <input 
                          type="date" 
                          value={inst.dueDate} 
                          onChange={e => {
                            const newInst = [...offerData.installments];
                            newInst[idx].dueDate = e.target.value;
                            setOfferData({...offerData, installments: newInst});
                          }}
                          style={{ width: '100%', height: '40px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                        />
                        <button 
                          onClick={() => {
                            const newInst = offerData.installments.filter((_, i) => i !== idx);
                            setOfferData({...offerData, installments: newInst});
                          }}
                          style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', background: 'rgba(244,63,94,0.05)', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setOfferData({...offerData, installments: [...offerData.installments, { amount: '', dueDate: format(new Date(), 'yyyy-MM-dd') }]})}
                      style={{ padding: '0.6rem', background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px dashed rgba(168,85,247,0.3)', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      + Add Installment
                    </button>
                    
                    {/* Sum Validation Warning */}
                    {offerData.installments.length > 0 && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: Math.abs(offerData.installments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) - Number(offerData.amount || 0)) < 0.01 ? '#10b981' : '#f43f5e', textAlign: 'right' }}>
                        Total: ₹{offerData.installments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toLocaleString('en-IN')} / ₹{Number(offerData.amount || 0).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ padding: '1rem', background: 'rgba(168,85,247,0.05)', borderRadius: '16px', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={24} color="#a855f7" />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>This is a legally binding offer structure. The founder can review and securely accept it within this encrypted thread.</p>
              </div>

              <button 
                onClick={() => {
                  if (offerData.isInstallmentPlan) {
                    const total = offerData.installments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
                    if (Math.abs(total - Number(offerData.amount)) > 0.01) {
                      toast.error('Installment total must match investment amount');
                      return;
                    }
                  }
                  handleSend(null, 'offer', offerData);
                }} 
                disabled={!offerData.amount || !offerData.equity}
                style={{ height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #a855f7, #7e22ce)', color: 'white', fontSize: '1.05rem', fontWeight: 800, border: 'none', cursor: (!offerData.amount || !offerData.equity) ? 'not-allowed' : 'pointer', opacity: (!offerData.amount || !offerData.equity) ? 0.6 : 1, boxShadow: (!offerData.amount || !offerData.equity) ? 'none' : '0 12px 28px rgba(168,85,247,0.3)', transition: 'all 0.3s', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Submit Official Offer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Send Money Modal */}
      {showPaymentModal && payingOffer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1.5rem' }}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '480px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', position: 'relative' }}>
            
            <div style={{ padding: '1.5rem 2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
              <button onClick={() => { setShowPaymentModal(false); setPayingOffer(null); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><X size={16} /></button>
              
              <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 4px 12px rgba(16,185,129,0.4))' }}>💸</span>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Send Investment</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Fulfill your accepted investment offer securely via Razorpay.</p>
            </div>

            <div style={{ padding: '0 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={14} /> Deal Summary
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Investment Amount</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>₹{Number(payingOffer.offerData?.amount || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Equity Secured</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>{payingOffer.offerData?.equity}%</div>
                  </div>
                </div>

                {/* Specific Installment Info if paying one */}
                {paymentSending && payingInstallmentId && (
                  <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', marginBottom: '0.25rem' }}>PAYING INSTALLMENT</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>₹{Number(payingOffer.offerData.installments.find(i => i._id === payingInstallmentId)?.amount || 0).toLocaleString('en-IN')}</div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Platform Fee (2%)</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 800 }}>+ ₹{(Number(payingOffer.offerData?.amount || 0) * 0.02).toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0', borderTop: '2px solid var(--border)' }}>
                  <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 900 }}>Total to Pay</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>₹{(Number(payingOffer.offerData?.amount || 0) * 1.02).toLocaleString('en-IN')}</span>
                </div>

                {payingOffer.offerData?.startupName && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--border)', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Rocket size={16} color="#10b981" /> {payingOffer.offerData.startupName}
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 800, color: '#10b981', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} /> Secure Payment
                </div>
                Clicking <b>Confirm & Send</b> will securely process the specified amount including a 2% convenience fee. The founder will be notified instantly.
              </div>

              {payingOffer.offerData?.isInstallmentPlan ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Select Installment to Pay</div>
                  {payingOffer.offerData.installments.map((inst, idx) => {
                    const isNext = payingOffer.offerData.installments.find(i => i.status === 'pending')?._id === inst._id || 
                                  (!inst._id && payingOffer.offerData.installments.findIndex(i => i.status === 'pending') === idx);
                    
                    return (
                      <div 
                        key={inst._id || idx} 
                        style={{ 
                          padding: '1rem', 
                          borderRadius: '16px', 
                          background: inst.status === 'paid' ? 'rgba(16,185,129,0.05)' : (isNext ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)'), 
                          border: isNext ? '2px solid #10b981' : '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          opacity: inst.status === 'paid' ? 0.7 : 1
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem' }}>₹{Number(inst.amount).toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {inst.dueDate && !isNaN(new Date(inst.dueDate)) ? format(new Date(inst.dueDate), 'PPP') : 'N/A'}</div>
                        </div>
                        {inst.status === 'paid' ? (
                          <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Paid
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>+2% Fee: ₹{(inst.amount * 0.02).toLocaleString('en-IN')}</div>
                            <button 
                              disabled={paymentSending || !isNext}
                              onClick={() => handleSendInvestment(inst._id)}
                              style={{ 
                                padding: '0.5rem 1rem', 
                                borderRadius: '10px', 
                                background: isNext ? '#10b981' : 'var(--border)', 
                                color: 'white', 
                                border: 'none', 
                                fontWeight: 800, 
                                fontSize: '0.8rem',
                                cursor: isNext ? 'pointer' : 'not-allowed'
                              }}
                            >
                              Pay ₹{(inst.amount * 1.02).toLocaleString('en-IN')}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <button onClick={() => { setShowPaymentModal(false); setPayingOffer(null); }} className="btn-secondary" style={{ height: '48px', borderRadius: '16px', fontWeight: 800, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', marginTop: '0.5rem' }}>Close</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button onClick={() => { setShowPaymentModal(false); setPayingOffer(null); }} className="btn-secondary" style={{ flex: 1, height: '56px', borderRadius: '16px', fontWeight: 800, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} disabled={paymentSending}>Cancel</button>
                  <button
                    onClick={() => handleSendInvestment()}
                    disabled={paymentSending}
                    style={{ flex: 2, height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', fontWeight: 800, fontSize: '1.05rem', cursor: paymentSending ? 'not-allowed' : 'pointer', opacity: paymentSending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 12px 28px rgba(16,185,129,0.3)', transition: 'all 0.3s' }}
                  >
                    {paymentSending ? 'Processing...' : <><span style={{ fontSize: '1.2rem' }}>₹</span> Confirm & Send</>}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Glassmorphic Delete Messages Modal ── */}
      <AnimatePresence>
        {showDeleteConfirmModal && (
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
            onClick={() => { if (!deleteSending) setShowDeleteConfirmModal(false); }}
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
              {/* Top Accent Danger Gradient Bar */}
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
                Delete {messagesToDelete.length === 1 ? 'Message' : 'Messages'}?
              </h3>
              
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.925rem',
                lineHeight: 1.6,
                marginBottom: '1.75rem',
                padding: '0 0.5rem'
              }}>
                Are you sure you want to delete {messagesToDelete.length === 1 ? 'this message' : `these ${messagesToDelete.length} messages`}? They will be permanently removed for everyone in this chat.
              </p>

              {/* Warning box */}
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

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.875rem' }}>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'var(--bg-hover)' }}
                  whileTap={{ scale: 0.98 }}
                  disabled={deleteSending}
                  onClick={() => setShowDeleteConfirmModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.8rem 1.25rem',
                    borderRadius: '14px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: deleteSending ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    opacity: deleteSending ? 0.6 : 1
                  }}
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
                  disabled={deleteSending}
                  onClick={executeDeleteMessages}
                  style={{
                    flex: 1,
                    padding: '0.8rem 1.25rem',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: deleteSending ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(244, 63, 94, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    opacity: deleteSending ? 0.8 : 1
                  }}
                >
                  {deleteSending ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
