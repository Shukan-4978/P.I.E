import React, { useState } from 'react';
import { HelpCircle, Mail, MessageSquare, ShieldAlert, FileQuestion, LifeBuoy, Search, ChevronRight, ExternalLink, BookOpen, Rocket, ShieldCheck, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const categories = [
    { id: 'all', label: 'All Topics', icon: HelpCircle },
    { id: 'getting-started', label: 'Getting Started', icon: Rocket },
    { id: 'security', label: 'Security & Trust', icon: ShieldCheck },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  ];

  const faqs = [
    { id: 1, cat: 'getting-started', q: 'How do I connect with an investor?', a: 'To connect, browse the "Explore" tab or your feed for investor profiles or funding need posts. Click "Connect" on their profile. Once they accept your request, a direct messaging channel will open where you can share documents and details.' },
    { id: 2, cat: 'security', q: 'Is my pitch deck secure?', a: 'Absolutely. P.I.E uses role-based access control. Your pitch deck and detailed metrics are only visible to verified investors who have an active connection with you. You can revoke access at any time from your Startup dashboard.' },
    { id: 3, cat: 'getting-started', q: 'How does the AI Analysis work?', a: 'Our AI engine scans your uploaded PDF pitch deck to analyze market size, product-market fit, and financial projections. It provides a score and feedback to help you improve your pitch before presenting to real investors.' },
    { id: 4, cat: 'billing', q: 'Can I change my subscription plan?', a: 'Yes, you can upgrade or downgrade your plan at any time from the Billing tab in Settings. Changes take effect immediately, and any remaining balance will be prorated.' },
    { id: 5, cat: 'security', q: 'What happens if I report a user?', a: 'When you report a user, our moderation team reviews their activity, chat logs, and profile data within 24 hours. If they violate our community standards, their account will be suspended or permanently banned.' }
  ];

  const filteredFaqs = faqs.filter(faq => 
    (activeCategory === 'all' || faq.cat === activeCategory) &&
    (faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || faq.a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header with Search */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>How can we <span className="gradient-text">help you?</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Search our knowledge base or reach out to our team of experts.</p>
        
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            placeholder="Search for articles, guides, or keywords..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1.25rem 1.25rem 1.25rem 3.5rem', 
              borderRadius: '20px', 
              border: '1px solid var(--border)', 
              background: 'var(--bg-card)',
              fontSize: '1rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            className="search-focus"
          />
        </div>
      </div>

      {/* Support Channels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {[
          { icon: Mail, title: 'Email Support', desc: 'Typical response time: < 2 hours', contact: 'support@pie.com', color: '#6366f1' },
          { icon: MessageSquare, title: 'Live Chat', desc: 'Available for Pro & Elite users', contact: 'Start Chat', color: '#10b981' },
          { icon: BookOpen, title: 'Documentation', desc: 'Deep dive into P.I.E features', contact: 'Read Guides', color: '#f59e0b' },
        ].map((item, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="card" 
            style={{ padding: '2rem', textAlign: 'center', borderRadius: '24px', border: '1px solid var(--border)' }}
          >
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '16px', 
              background: `${item.color}15`, 
              color: item.color, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem' 
            }}>
              <item.icon size={28} />
            </div>
            <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>{item.title}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{item.desc}</p>
            <button className="btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>{item.contact}</button>
          </motion.div>
        ))}
      </div>

      {/* FAQs Section */}
      <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: '32px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '14px' }}>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '10px', 
                  fontSize: '0.8rem', 
                  fontWeight: 700,
                  background: activeCategory === cat.id ? 'var(--bg-card)' : 'transparent',
                  color: activeCategory === cat.id ? '#6366f1' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: activeCategory === cat.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => (
                <motion.div 
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '20px', 
                    overflow: 'hidden',
                    background: openFaq === faq.id ? 'var(--bg-secondary)' : 'transparent',
                    transition: 'background 0.3s'
                  }}
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    style={{ 
                      width: '100%', 
                      padding: '1.5rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>?</div>
                      {faq.q}
                    </div>
                    <ChevronRight 
                      size={20} 
                      style={{ 
                        transform: openFaq === faq.id ? 'rotate(90deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.3s',
                        color: 'var(--text-muted)'
                      }} 
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === faq.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 1.5rem 1.5rem 4.1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <LifeBuoy size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No results found for "{searchQuery}"</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Security Banner */}
      <div style={{ 
        marginTop: '4rem', 
        padding: '3rem', 
        borderRadius: '32px', 
        background: 'linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(244,63,94,0.02) 100%)', 
        border: '1px solid rgba(244,63,94,0.15)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '2.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '24px', 
          background: 'rgba(244,63,94,0.1)', 
          color: '#f43f5e', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ShieldAlert size={40} />
        </div>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Report a Security Issue</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>Our security team takes all reports seriously. If you've found a vulnerability, please reach out to our bug bounty team.</p>
        </div>
        <button className="btn-primary" style={{ background: '#f43f5e', border: 'none', padding: '1rem 2rem' }}>Report Vulnerability</button>
      </div>
    </div>
  );
};

export default HelpPage;
