import React, { useState, useEffect } from 'react';
import { 
  Cpu, User, Rocket, FileText, Download, 
  Search, Filter, ChevronLeft, ChevronRight, 
  CheckCircle, AlertCircle, Clock, ExternalLink,
  BarChart, PieChart, Shield
} from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const AdminAIAnalysis = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchAnalyses();
  }, [page]);

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/ai-analyses?page=${page}`);
      setAnalyses(data.analyses);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch analyses');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'processing': return '#6366f1';
      case 'failed': return '#f43f5e';
      default: return '#f59e0b';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={28} color="#6366f1" /> AI Pitch Analysis Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor and review all AI-generated pitch deck analyses.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input placeholder="Search founders..." className="input" style={{ paddingLeft: '2.5rem', width: '250px' }} />
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} /> Filter
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Founder</th>
                <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Startup</th>
                <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pitch Deck</th>
                <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</th>
                <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}><td colSpan="7" style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} /></td></tr>
                ))
              ) : analyses.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No AI analyses found.</td></tr>
              ) : analyses.map((a) => (
                <tr key={a._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={a.uploadedBy?.avatar ? `http://localhost:1110${a.uploadedBy.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(a.uploadedBy?.name || 'U')}&background=6366f1&color=fff`} style={{ width: '32px', height: '32px', borderRadius: '8px' }} alt="" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.uploadedBy?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.uploadedBy?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                      <Rocket size={14} color="#8b5cf6" />
                      {a.startup?.title || 'Standalone Analysis'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <a href={`http://localhost:1110${a.pitchDeckUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                      <FileText size={14} />
                      <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.originalFileName || 'View PDF'}</span>
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.6rem', borderRadius: '999px', background: `${getStatusColor(a.status)}15`, color: getStatusColor(a.status), fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                      {a.status === 'completed' && <CheckCircle size={12} />}
                      {a.status === 'failed' && <AlertCircle size={12} />}
                      {a.status === 'processing' && <Clock size={12} className="spin" />}
                      {a.status}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 800, color: a.investmentScore > 70 ? '#10b981' : a.investmentScore > 40 ? '#f59e0b' : '#f43f5e' }}>
                      {a.status === 'completed' ? `${a.investmentScore}%` : '—'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(a.createdAt))} ago
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button className="btn-secondary" style={{ padding: '0.5rem' }} title="View Results">
                      <BarChart size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <b>{analyses.length}</b> of <b>{total}</b> analyses
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0.5rem' }}><ChevronLeft size={18} /></button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.9rem', fontWeight: 600 }}>Page {page}</div>
            <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={analyses.length < 20} style={{ padding: '0.5rem' }}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAIAnalysis;
