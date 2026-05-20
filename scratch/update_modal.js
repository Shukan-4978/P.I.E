const fs = require('fs');
const file = 'c:/Users/lenovo/OneDrive/Desktop/AI/2/frontend/src/pages/Profile.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `// ── Investment Detail Modal ──────────────────────────────────────────────────
const EXIT_STYLES = {
  Active:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  label: 'Active'   },
  Acquired: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)',  label: 'Acquired' },
  IPO:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)',  label: 'IPO'     },
  Closed:   { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.2)',   label: 'Closed'  },
};

const ROUND_COLORS = {
  'Pre-Seed': '#ec4899', 'Seed': '#8b5cf6', 'Series A': '#6366f1',
  'Series B': '#3b82f6', 'Series C+': '#06b6d4', 'Angel': '#10b981', 'Growth': '#f59e0b',
};

const InvestmentDetailModal = ({ inv, investorName, investorAvatar, onClose }) => {
  if (!inv) return null;
  const exitStyle = EXIT_STYLES[inv.exitStatus] || EXIT_STYLES.Active;
  const roundColor = ROUND_COLORS[inv.round] || '#6366f1';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '560px', maxHeight: '90vh',
          background: 'var(--bg-card)',
          borderRadius: '28px',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        <style>{\`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { 
            from { opacity: 0; transform: translateY(40px) scale(0.95); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
          }
          .metric-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 1rem;
            text-align: center;
            transition: all 0.3s ease;
          }
          .metric-card:hover {
            transform: translateY(-4px);
            border-color: rgba(99,102,241,0.3);
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          }
          .investor-card {
            background: linear-gradient(145deg, var(--bg-secondary), var(--bg-card));
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            gap: 1.25rem;
            transition: all 0.3s ease;
          }
          .investor-card:hover {
            border-color: rgba(16,185,129,0.3);
            box-shadow: 0 10px 30px -10px rgba(16,185,129,0.15);
          }
          /* Custom scrollbar for modal content */
          .modal-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .modal-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .modal-scroll::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 10px;
          }
          .modal-scroll::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted);
          }
        \`}</style>

        {/* Header Banner */}
        <div style={{
          height: '110px', position: 'relative', flexShrink: 0,
          background: \`linear-gradient(135deg, \${roundColor}, \${exitStyle.color})\`
        }}>
          <div style={{ position:'absolute', inset:0, opacity:0.1, backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'24px 24px' }} />
          
          <button
            onClick={onClose}
            style={{ 
              position:'absolute', top:'1rem', left:'1rem', 
              width:'36px', height:'36px', borderRadius:'50%', 
              background:'rgba(0,0,0,0.2)', backdropFilter:'blur(8px)', 
              border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', 
              display:'flex', alignItems:'center', justifyContent:'center', 
              color:'white', transition:'all 0.2s', zIndex: 10
            }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(0,0,0,0.2)'}
          >
            <X size={18} />
          </button>

          <div style={{ 
            position:'absolute', top:'1rem', right:'1rem', 
            padding:'0.4rem 0.8rem', borderRadius:'12px', 
            background:'rgba(255,255,255,0.15)', backdropFilter:'blur(12px)', 
            border:'1px solid rgba(255,255,255,0.2)', color:'white', 
            fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.05em',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            textTransform: 'uppercase'
          }}>
            <Activity size={14} /> {exitStyle.label}
          </div>

          {/* Overlapping Company Logo */}
          <div style={{ 
            position:'absolute', bottom:'-24px', left:'2rem', 
            width:'70px', height:'70px', borderRadius:'20px', 
            background:'var(--bg-card)', border:'1px solid var(--border)', 
            boxShadow:'0 10px 25px rgba(0,0,0,0.1)', 
            display:'flex', alignItems:'center', justifyContent:'center', 
            fontSize:'2rem', fontWeight:900, color:roundColor,
            zIndex: 5
          }}>
            {inv.companyName?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Content Body */}
        <div className="modal-scroll" style={{ padding: '2.5rem 2rem 1.5rem', flex: 1, overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.1 }}>
                {inv.companyName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {inv.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <MapPin size={14} /> {inv.location}
                  </span>
                )}
                {inv.website && (
                  <>
                    <span style={{ color: 'var(--border)' }}>•</span>
                    <a href={inv.website.startsWith('http') ? inv.website : \`https://\${inv.website}\`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: roundColor, fontWeight: 700, textDecoration: 'none' }}>
                      <Globe size={14} /> Website
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            {inv.sector && (
              <div style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Briefcase size={14} color="var(--text-muted)" /> {inv.sector}
              </div>
            )}
            {inv.round && (
              <div style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: \`\${roundColor}15\`, border: \`1px solid \${roundColor}30\`, color: roundColor, fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={14} /> {inv.round}
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { icon: DollarSign, label: 'Investment', value: inv.amount || 'Undisclosed', color: '#10b981' },
              { icon: Calendar, label: 'Year', value: inv.year || '—', color: '#6366f1' },
              { icon: Rocket, label: 'Exit Status', value: inv.exitStatus || '—', color: exitStyle.color },
            ].map((m, i) => (
              <div key={i} className="metric-card">
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: \`\${m.color}15\`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', color: m.color }}>
                  <m.icon size={18} />
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Investor Verification */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 800 }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} strokeWidth={3} />
              </div>
              Verified Portfolio Item
            </div>
            
            <div className="investor-card">
              <img 
                src={investorAvatar} 
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(16,185,129,0.3)' }} 
                alt={investorName} 
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  Investor Entity
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {investorName}
                </div>
              </div>
              <div style={{ padding: '0.4rem 0.8rem', borderRadius: '10px', background: exitStyle.bg, color: exitStyle.color, fontSize: '0.7rem', fontWeight: 800, border: \`1px solid \${exitStyle.border}\` }}>
                {inv.exitStatus}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>
            This record was added by the verified investor and is subject to P.I.E platform terms.
          </p>
        </div>

      </div>
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────`;

const startIndex = content.indexOf('// ── Investment Detail Modal');
const endIndex = content.indexOf('// ────────────────────────────────────────────────────────────────────────────', startIndex) + '// ────────────────────────────────────────────────────────────────────────────'.length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully replaced InvestmentDetailModal with scrolling and max-height fixes');
} else {
  console.error('Could not find component boundaries');
}
