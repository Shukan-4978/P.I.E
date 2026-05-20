import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ 
      background: 'var(--bg-card)', 
      borderTop: '1px solid var(--border)',
      padding: '2rem 2.5rem',
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--brand-500), #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={18} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ 
              fontWeight: 900, 
              fontSize: '1.25rem', 
              color: 'var(--text-primary)',
              letterSpacing: '-0.04em'
            }}>
              P.I.E
            </span>
          </Link>
          <div style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.9rem', 
            fontWeight: 500 
          }}>
            &copy; {currentYear} P.I.E Platform. All rights reserved.
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          <Link to="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>About</Link>
          <Link to="/help" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Help</Link>
          <Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
