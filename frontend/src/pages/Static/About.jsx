import React from 'react';
import { Info, Target, Shield, Users, Globe, Rocket, Award, Heart, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AboutPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}
    >
      {/* Hero Section */}
      <motion.div 
        variants={itemVariants}
        className="card" 
        style={{ 
          padding: '4rem 2rem', 
          textAlign: 'center', 
          marginBottom: '3rem', 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderRadius: '32px',
          border: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '28px', 
            background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 2rem', 
            color: 'white',
            boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
            transform: 'rotate(-5deg)'
          }}>
            <Globe size={48} />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            Elevating <span className="gradient-text">Founders</span> & <span className="gradient-text">Investors</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '700px', margin: '0 auto', fontWeight: 500 }}>
            P.I.E (Platform for Investors & Entrepreneurs) is the world's first trust-driven social ecosystem designed to accelerate the journey from idea to investment.
          </p>
        </div>
      </motion.div>

      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {[
          { icon: Users, label: 'Active Users', value: '50,000+', color: '#6366f1' },
          { icon: Rocket, label: 'Startups Funded', value: '1,200+', color: '#10b981' },
          { icon: Globe, label: 'Global Cities', value: '180+', color: '#f59e0b' },
          { icon: Award, label: 'Success Rate', value: '85%', color: '#ec4899' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="card" 
            style={{ padding: '2rem', textAlign: 'center', borderRadius: '24px', transition: 'transform 0.3s' }}
            whileHover={{ y: -5 }}
          >
            <div style={{ color: stat.color, marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
              <stat.icon size={32} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.25rem' }}>{stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Mission & Vision */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
        <motion.div variants={itemVariants} className="card" style={{ padding: '2.5rem', borderRadius: '24px', borderLeft: '6px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
              <Target color="#6366f1" size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Our Mission</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>
            To build the most trusted network for early-stage capital. We provide founders with the visibility they deserve and investors with the data-driven insights they need to make high-conviction decisions.
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="card" style={{ padding: '2.5rem', borderRadius: '24px', borderLeft: '6px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
              <Shield color="#10b981" size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Vetting Standards</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>
            Quality over quantity. Every startup profile and investment post is vetted by our AI and moderation team to ensure P.I.E remains a high-signal environment for serious professional networking.
          </p>
        </motion.div>
      </div>

      {/* Core Values with Icons */}
      <motion.div variants={itemVariants} className="card" style={{ padding: '3rem', borderRadius: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2.5rem', textAlign: 'center' }}>The P.I.E Philosophy</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
          {[
            { icon: Rocket, title: 'Speed to Capital', desc: 'Why wait months? We help founders close rounds in weeks through targeted matching.' },
            { icon: Heart, title: 'Founder First', desc: 'Everything we build starts with the question: "How does this help the entrepreneur?"' },
            { icon: CheckCircle, title: 'Transparency', desc: 'No gatekeepers. Direct connections and verified data are in our DNA.' }
          ].map((v, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ color: '#6366f1' }}><v.icon size={28} /></div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{v.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{v.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA Footer */}
      <motion.div 
        variants={itemVariants}
        style={{ marginTop: '4rem', textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)' }}
      >
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Ready to build the future?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Join thousands of founders and investors already on P.I.E</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-primary" style={{ padding: '0.75rem 2rem' }}>Join the Network</button>
          <button className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>Contact Us</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AboutPage;
