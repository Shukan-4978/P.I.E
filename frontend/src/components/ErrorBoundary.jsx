import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CRITICAL UI ERROR:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', padding: '2rem', fontFamily: 'system-ui' }}>
          <div style={{ maxWidth: '600px', width: '100%', background: '#1e293b', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', color: '#f43f5e' }}>Something went wrong</h1>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.85rem', color: '#f87171', overflow: 'auto', marginBottom: '1.5rem', border: '1px solid #334155' }}>
              <code>{this.state.error?.toString()}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
