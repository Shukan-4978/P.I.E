import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, FileText, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Legal = () => {
  const { pathname } = useLocation();
  const isPrivacy = pathname.includes('privacy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const sections = isPrivacy ? [
    {
      title: "1. Information We Collect",
      content: "We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include your name, email address, phone number, and financial information related to investments."
    },
    {
      title: "2. How We Use Information",
      content: "We use the information we collect to provide, maintain, and improve our services, to process transactions, and to communicate with you about updates, security alerts, and support messages."
    },
    {
      title: "3. Sharing of Information",
      content: "We may share information with founders and investors on the platform as necessary to facilitate connections and deals. We do not sell your personal information to third parties."
    },
    {
      title: "4. Security",
      content: "We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction."
    }
  ] : [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing or using the P.I.E platform, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service."
    },
    {
      title: "2. Eligibility",
      content: "You must be at least 18 years old to use the platform. By using P.I.E, you represent and warrant that you meet this requirement."
    },
    {
      title: "3. User Conduct",
      content: "You agree not to use the platform for any illegal purpose or in any way that could damage, disable, overburden, or impair the service."
    },
    {
      title: "4. Investment Risks",
      content: "Investing in startups involves significant risk. P.I.E does not provide financial advice and is not responsible for any investment decisions made through the platform."
    },
    {
      title: "5. Payments and Fraud Protection",
      content: "To ensure your safety and protect against potential fraud or cheating, all payments must be processed through the P.I.E platform after closing a deal with any user. We can only provide assistance and support for transactions completed within our secure app. If you process payments outside the platform, we cannot help you in case of fraud or other disputes. For large amounts, we strongly recommend selecting the installment option and paying through our platform. Any payment-related support is strictly limited to transactions handled by P.I.E.",
      highlight: true
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '6rem 2rem 4rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '3rem' }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-500)', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', color: 'var(--brand-500)' }}>
              {isPrivacy ? <Shield size={32} /> : <FileText size={32} />}
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
              {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Last updated: May 15, 2026. Please read these {isPrivacy ? 'privacy policies' : 'terms'} carefully to understand how P.I.E manages data and user conduct.
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {sections.map((section, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              style={{ 
                background: section.highlight ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)', 
                padding: '2rem', 
                borderRadius: '24px', 
                border: section.highlight ? '2px solid var(--brand-500)' : '1px solid var(--border)',
                boxShadow: '0 4px 20px var(--shadow-color)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {section.highlight && (
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  background: 'var(--brand-500)', 
                  color: 'white', 
                  padding: '4px 12px', 
                  fontSize: '0.7rem', 
                  fontWeight: 900, 
                  textTransform: 'uppercase',
                  borderBottomLeftRadius: '12px'
                }}>
                  Crucial
                </div>
              )}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="var(--brand-500)" /> {section.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1rem' }}>
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px dashed var(--border)' }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Have questions about our {isPrivacy ? 'Privacy Policy' : 'Terms'}? <br />
            Contact us at <span style={{ color: 'var(--brand-500)', fontWeight: 700 }}>support@pieplatform.com</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Legal;
