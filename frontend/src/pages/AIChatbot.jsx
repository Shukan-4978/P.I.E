import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, User, Sparkles, Loader } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const AIChatbot = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/ai/chat');
        if (data && data.length > 0) {
          setMessages(data);
        } else {
          // Add initial greeting based on role
          setMessages([
            {
              _id: 'init',
              role: 'model',
              content: user?.role === 'founder' 
                ? `Hi ${user?.name?.split(' ')[0]}! I'm your AI Startup Growth Advisor. I can help you with strategies for scaling, securing funding, finding product-market fit, and pitching to investors. How can I assist your startup today?`
                : `Hi ${user?.name?.split(' ')[0]}! I'm your AI Investment Advisor. I can help you evaluate startups, analyze market trends, perform due diligence, and optimize your portfolio. What would you like to discuss today?`
            }
          ]);
        }
      } catch (err) {
        toast.error('Failed to load chat history.');
      } finally {
        setIsFetchingHistory(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { _id: tempId, role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: userMessage });
      // Replace temp message with actual, and add AI response
      setMessages(prev => [
        ...prev.filter(m => m._id !== tempId),
        data.userMessage,
        data.aiMessage
      ]);
    } catch (err) {
      toast.error('Failed to get response from AI Advisor.');
      // Remove the optimistic message on failure
      setMessages(prev => prev.filter(m => m._id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  if (false) { // (user?.subscriptionPlan === 'free' || user?.subscriptionPlan === 'plus') {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Bot size={40} />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Meet Your <span style={{ color: '#6366f1' }}>AI Growth Partner</span></h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Unlock the AI Advisor to get strategic insights on scaling, funding Evaluation, and market trends tailored to your role.
        </p>
        <Link to="/pricing" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ padding: '0.75rem 2.5rem', borderRadius: '14px', fontWeight: 700 }}>Upgrade to Pro</button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Sparkles size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>AI Advisor</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {user?.role === 'founder' ? 'Strategic advice for your startup growth' : 'Intelligent insights for your investments'}
          </p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
        {isFetchingHistory ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <Loader size={24} className="animate-spin" />
            <span style={{ marginLeft: '0.5rem' }}>Loading conversation...</span>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={msg._id || idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: msg.role === 'user' ? 'var(--bg-tertiary)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: msg.role === 'user' ? 'var(--text-primary)' : '#6366f1', border: `1px solid ${msg.role === 'user' ? 'var(--border)' : 'rgba(99,102,241,0.2)'}` }}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div style={{ maxWidth: '80%', padding: '1rem 1.25rem', borderRadius: '16px', background: msg.role === 'user' ? '#6366f1' : 'var(--bg-secondary)', color: msg.role === 'user' ? 'white' : 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99,102,241,0.2)' : 'none' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Bot size={18} />
                </div>
                <div style={{ padding: '1rem 1.25rem', borderRadius: '16px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                  <span style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.2s' }}></span>
                  <span style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0 0 16px 16px', borderTop: '1px solid var(--border)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI Advisor..."
            className="input"
            disabled={isLoading || isFetchingHistory}
            style={{ paddingRight: '3rem', borderRadius: '24px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || isFetchingHistory}
            style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', background: input.trim() ? '#6366f1' : 'var(--bg-tertiary)', color: input.trim() ? 'white' : 'var(--text-muted)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !isLoading ? 'pointer' : 'default', transition: 'all 0.2s' }}
          >
            {isLoading ? <Loader size={16} className="animate-spin" /> : <Send size={16} style={{ marginLeft: '-2px' }} />}
          </button>
        </form>
        <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          AI responses are generated by Gemini and may not be 100% accurate. History auto-deletes after 10 days.
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AIChatbot;
