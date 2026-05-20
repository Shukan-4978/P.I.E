import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import { Brain, Upload, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Target, Users, IndianRupee, ArrowRight, RefreshCw, ChevronRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ScoreCircle = ({ score, label, color = '#6366f1' }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 0.5rem' }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="30" fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
        <circle cx="36" cy="36" r="30" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${(score / 100) * 188} 188`} strokeLinecap="round"
          transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 1.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color }}>{score}</div>
    </div>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>{label}</div>
  </div>
);

const RECOMMENDATION_CONFIG = {
  Invest: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', emoji: '✅' },
  Consider: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', emoji: '🤔' },
  Avoid: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', emoji: '❌' },
  Pending: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', border: 'var(--border)', emoji: '⏳' },
};

const AIAnalysis = () => {
  const { user } = useAuthStore();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [queued, setQueued] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [pollingId, setPollingId] = useState(null);

  React.useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const { data } = await api.get('/ai/analyses');
      setAnalyses(data);
      if (data.length > 0 && !selectedAnalysis) setSelectedAnalysis(data[0]);
    } catch (e) { console.error(e); }
    finally { setLoadingAnalyses(false); }
  };

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.ms-powerpoint': ['.ppt'], 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  React.useEffect(() => {
    return () => {
      if (pollingId) clearInterval(pollingId);
    };
  }, [pollingId]);

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file first');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('pitchDeck', file);
      const { data } = await api.post('/ai/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setQueued(data);
      setFile(null);
      toast.success('Pitch deck uploaded! Analysis is processing...');
      
      // Poll for completion
      const pid = setInterval(async () => {
        try {
          const res = await api.get(`/ai/analyses/${data.analysisId}`);
          if (res.data.status === 'completed' || res.data.status === 'failed') {
            clearInterval(pid);
            setPollingId(null);
            setQueued(null);
            await fetchAnalyses();
            setSelectedAnalysis(res.data);
            if (res.data.status === 'completed') {
              toast.success('🧠 AI Analysis complete!');
            } else {
              toast.error(res.data.errorMessage || 'Analysis failed. Please try again.');
            }
          }
        } catch (e) { 
          clearInterval(pid); 
          setPollingId(null);
          setQueued(null);
        }
      }, 4000);
      setPollingId(pid);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const rcfg = selectedAnalysis ? RECOMMENDATION_CONFIG[selectedAnalysis.recommendation] : null;

  if (false) { // (user?.subscriptionPlan === 'free') {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #10b981, #6366f1)' }} />
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Brain size={40} />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Get Institutional-Grade <span style={{ color: '#10b981' }}>Analysis</span></h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Unlock AI Pitch Analysis to get deep insights into market size, team quality, and revenue models before you pitch or invest.
        </p>
        <Link to="/pricing" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ padding: '0.75rem 2.5rem', borderRadius: '14px', fontWeight: 700, background: '#10b981' }}>Upgrade to Plus</button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Brain size={28} color="#6366f1" />AI Pitch Analyzer</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Upload your pitch deck and get institutional-grade AI analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Upload panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Upload Pitch Deck</h3>
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? '#6366f1' : 'var(--border)'}`,
                borderRadius: '14px',
                padding: '2rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? 'rgba(99,102,241,0.05)' : 'var(--bg-secondary)',
                transition: 'all 0.2s ease',
                marginBottom: '1rem',
              }}
            >
              <input {...getInputProps()} />
              {file ? (
                <div>
                  <FileText size={36} color="#6366f1" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{file.name}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <Upload size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{isDragActive ? 'Drop it here!' : 'Drag & drop your pitch deck'}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PDF, PPT, PPTX · Max 20MB</p>
                </div>
              )}
            </div>

            <button onClick={handleUpload} className="btn-primary" disabled={!file || uploading} style={{ width: '100%', justifyContent: 'center' }}>
              {uploading ? <><RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} />Uploading...</> : <><Brain size={16} />Analyze Pitch Deck</>}
            </button>

            {/* Queue status */}
            {queued && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', textAlign: 'center' }}>
                <RefreshCw size={20} color="#6366f1" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#818cf8' }}>Analysis in progress...</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>This usually takes 30-60 seconds. You'll be notified when ready.</p>
              </div>
            )}
          </div>

          {/* Past analyses */}
          {analyses.length > 0 && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Past Analyses</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analyses.map(a => (
                  <button key={a._id} onClick={() => setSelectedAnalysis(a)} className="btn-ghost" style={{ width: '100%', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: selectedAnalysis?._id === a._id ? 'rgba(99,102,241,0.1)' : 'transparent', borderRadius: '10px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      {a.status === 'completed' ? <CheckCircle size={15} color="#10b981" /> : a.status === 'failed' ? <AlertCircle size={15} color="#f43f5e" /> : <Clock size={15} color="#f59e0b" />}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.originalFileName || 'Pitch Deck'}</span>
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analysis results */}
        {selectedAnalysis && selectedAnalysis.status === 'completed' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Recommendation banner */}
            <div style={{ padding: '1.5rem', borderRadius: '16px', background: rcfg.bg, border: `1px solid ${rcfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: rcfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>AI Recommendation</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: rcfg.color }}>{rcfg.emoji} {selectedAnalysis.recommendation}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '500px' }}>{selectedAnalysis.recommendationReason}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Investment Score</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: rcfg.color }}>{selectedAnalysis.investmentScore}<span style={{ fontSize: '1rem' }}>/100</span></div>
              </div>
            </div>

            {/* Score circles */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Detailed Scores</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
                <ScoreCircle score={selectedAnalysis.marketScore} label="Market" color="#6366f1" />
                <ScoreCircle score={selectedAnalysis.problemClarity} label="Problem" color="#8b5cf6" />
                <ScoreCircle score={selectedAnalysis.solutionStrength} label="Solution" color="#06b6d4" />
                <ScoreCircle score={selectedAnalysis.teamQuality} label="Team" color="#10b981" />
                <ScoreCircle score={selectedAnalysis.revenueModelScore} label="Revenue" color="#f59e0b" />
              </div>
            </div>

            {/* Summary */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Executive Summary</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{selectedAnalysis.summary}</p>
            </div>

            {/* Strengths & Weaknesses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✅ Strengths</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedAnalysis.strengths?.map((s, i) => <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', background: 'rgba(16,185,129,0.06)', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>{s}</li>)}
                </ul>
              </div>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚠️ Weaknesses</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedAnalysis.weaknesses?.map((w, i) => <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', background: 'rgba(244,63,94,0.06)', borderRadius: '8px', borderLeft: '3px solid #f43f5e' }}>{w}</li>)}
                </ul>
              </div>
            </div>

            {/* Market & Revenue */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={16} color="#6366f1" />Market Size</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedAnalysis.marketSize}</p>
              </div>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IndianRupee size={16} color="#10b981" />Revenue Model</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedAnalysis.revenueModel}</p>
              </div>
            </div>

            {/* Risk factors */}
            {selectedAnalysis.riskFactors?.length > 0 && (
              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f59e0b' }}>⚡ Risk Factors</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedAnalysis.riskFactors.map((r, i) => <span key={i} className="badge badge-warning">{r}</span>)}
                </div>
              </div>
            )}
          </div>
        ) : selectedAnalysis?.status === 'processing' || selectedAnalysis?.status === 'queued' ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <Brain size={48} color="#6366f1" style={{ margin: '0 auto 1rem', animation: 'pulse 2s ease-in-out infinite' }} />
            <h3>Analysis in Progress</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>GPT-4 is analyzing your pitch deck. You'll receive a notification when it's ready.</p>
          </div>
        ) : selectedAnalysis?.status === 'failed' ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <AlertCircle size={48} color="#f43f5e" style={{ margin: '0 auto 1rem' }} />
            <h3>Analysis Failed</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{selectedAnalysis.errorMessage || 'Please try uploading again.'}</p>
          </div>
        ) : (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <Brain size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <h3>Upload a Pitch Deck</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Get AI-powered investment analysis in minutes</p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
};

export default AIAnalysis;
