import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Plus, X, Briefcase, DollarSign, Calendar,
  Globe, Edit3, Save, Trash2, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const ROUNDS = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Angel', 'Growth'];
const EXIT_STATUSES = ['Active', 'Acquired', 'IPO', 'Closed'];
const SECTORS = ['AI/ML', 'SaaS', 'Fintech', 'HealthTech', 'EdTech', 'CleanTech', 'E-commerce', 'Blockchain', 'Logistic', 'Cybersecurity', 'PropTech', 'Other'];

const EXIT_COLORS = {
  Active: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  Acquired: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
  IPO: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  Closed: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)' },
};

const emptyInvestment = () => ({
  companyName: '',
  year: new Date().getFullYear().toString(),
  amount: '',
  sector: '',
  round: 'Seed',
  website: '',
  location: '',
  proofFile: null,
  exitStatus: 'Active'
});

const MyInvestments = () => {
  const { user, updateUser } = useAuthStore();
  const [investments, setInvestments] = useState([]);
  const [investmentFocus, setInvestmentFocus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState(emptyInvestment());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleAddNewClick = async () => {
    try {
      const { data } = await api.get('/auth/limits');
      const planLimits = data[user?.subscriptionPlan || 'free'];
      const used = user?.usageStats?.investmentsMonth?.count || 0;
      if (used >= planLimits.investments) {
        setShowUpgradeModal(true);
        return;
      }
    } catch (err) {
      console.error(err);
    }
    setShowForm(true);
    setEditIndex(null);
    setForm(emptyInvestment());
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setInvestments(data.pastInvestments || []);
        setInvestmentFocus(data.investmentFocus?.join(', ') || '');
      } catch (err) {
        toast.error('Failed to load investments');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const saveToDB = async (invList, revertList = null) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('pastInvestments', JSON.stringify(invList));
      const focusArr = investmentFocus.split(',').map(s => s.trim()).filter(Boolean);
      fd.append('investmentFocus', JSON.stringify(focusArr));
      const { data } = await api.put('/auth/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data);
      setInvestments(data.pastInvestments || invList);
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to save';
      toast.error(errMsg);
      if (revertList !== null) setInvestments(revertList);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('pastInvestments', JSON.stringify(investments));
      const focusArr = investmentFocus.split(',').map(s => s.trim()).filter(Boolean);
      fd.append('investmentFocus', JSON.stringify(focusArr));
      const { data } = await api.put('/auth/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data);
      setInvestments(data.pastInvestments || investments);
      toast.success('Investment profile saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOrEdit = async () => {
    if (!form.companyName.trim()) return toast.error('Company name is required');
    if (!form._id && !form.proofFile) return toast.error('Proof of investment is required');

    setSaving(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k !== 'proofFile') {
          fd.append(k, form[k]);
        }
      });
      if (form.proofFile) {
        fd.append('proof', form.proofFile);
      }

      if (editIndex !== null && form._id) {
        const { data } = await api.put(`/auth/investments/${form._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updateUser(data);
        setInvestments(data.pastInvestments);
        toast.success('Investment updated! Sent for review.');
      } else {
        const { data } = await api.post('/auth/investments', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updateUser(data);
        setInvestments(data.pastInvestments);
        toast.success('Investment added! Sent for review.');
      }
      setForm(emptyInvestment());
      setShowForm(false);
      setEditIndex(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save investment');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (i) => {
    setForm({ ...investments[i], proofFile: null });
    setEditIndex(i);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (index) => {
    setConfirmDelete(investments[index]);
  };

  const proceedDelete = async () => {
    const inv = confirmDelete;
    if (!inv?._id) return toast.error('Invalid investment ID');

    setConfirmDelete(null);
    const loadingToast = toast.loading('Removing investment...');
    try {
      console.log('Proceeding with API delete for:', inv._id);
      const { data } = await api.delete(`/auth/investments/${inv._id}`);
      updateUser(data);
      setInvestments(data.pastInvestments || []);
      toast.success('Investment removed', { id: loadingToast });
    } catch (err) {
      console.error('Delete API Error:', err);
      toast.error(err.response?.data?.error || 'Failed to remove investment', { id: loadingToast });
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem', gap: '1rem', flexDirection: 'column' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '6rem', padding: '0 1.5rem' }}>
      <style>{`
        .glass-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 24px; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .investment-card:hover { transform: translateY(-4px); border-color: var(--brand-500); box-shadow: 0 15px 40px rgba(0,0,0,0.06); }
        .btn-sleek { height: 44px; padding: 0 1.5rem; border-radius: 12px; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 0.6rem; transition: all 0.2s; cursor: pointer; border: none; }
        .btn-sleek.primary { background: var(--brand-500); color: white; box-shadow: 0 4px 12px rgba(99,102,241,0.2); }
        .btn-sleek.secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); }
        .btn-sleek:hover { transform: translateY(-1px); }
        .input-group { margin-bottom: 1.25rem; }
        .input-label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
        .pill-badge { padding: 0.25rem 0.6rem; border-radius: 8px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; }
      `}</style>

      {/* Header */}
      <div style={{ paddingTop: '3rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>My Investments</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>Track and showcase your portfolio to founders.</p>
          </div>
          <button onClick={handleAddNewClick} className="btn-sleek primary">
            <Plus size={18} /> Add New Deal
          </button>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Investment Focus</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input value={investmentFocus} onChange={e => setInvestmentFocus(e.target.value)} placeholder="AI/ML, Fintech, SaaS (Comma separated)" className="input" style={{ flex: 1 }} />
              <button onClick={handleSaveAll} disabled={saving} className="btn-sleek primary" style={{ height: '50px' }}>
                <Save size={18} /> {saving ? 'Saving...' : 'Update Focus'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      {investments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-secondary)', borderRadius: '32px', border: '1px dashed var(--border)' }}>
          <TrendingUp size={48} color="var(--text-muted)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
          <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Empty Portfolio</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>List your investments to build trust with founders.</p>
          <button onClick={handleAddNewClick} className="btn-sleek primary" style={{ margin: '0 auto' }}>Start Portfolio</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {investments.map((inv, idx) => {
            const exit = EXIT_COLORS[inv.exitStatus] || EXIT_COLORS.Active;
            return (
              <div key={idx} className="glass-card investment-card" style={{ position: 'relative' }}>
                <div style={{ height: '5px', background: exit.color }} />
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${exit.color}15`, color: exit.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 }}>{inv.companyName?.[0]?.toUpperCase()}</div>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', position: 'relative', zIndex: 50 }}>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(idx); }} 
                        className="btn-ghost" 
                        style={{ padding: '8px', borderRadius: '10px', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
                        title="Edit Details"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(idx); }} 
                        className="btn-ghost" 
                        style={{ padding: '8px', borderRadius: '10px', color: '#f43f5e', background: 'var(--bg-secondary)' }}
                        title="Delete Investment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                    {inv.status === 'pending' && <span className="pill-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>Pending</span>}
                    {inv.status === 'accepted' && <span className="pill-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>Verified</span>}
                    {inv.status === 'rejected' && <span className="pill-badge" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>Rejected</span>}
                  </div>
                  {inv.status === 'rejected' && inv.rejectionReason && (
                    <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '12px', fontSize: '0.8rem', color: '#f43f5e' }}>
                      <strong>Reason for Rejection:</strong> {inv.rejectionReason}
                    </div>
                  )}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '0.25rem' }}>{inv.companyName}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <span className="pill-badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>{inv.sector}</span>
                      <span className="pill-badge" style={{ background: exit.bg, color: exit.color, border: `1px solid ${exit.border}` }}>{inv.exitStatus}</span>
                    </div>
                    {inv.location && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inv.location)}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--brand-500)', textDecoration: 'none', fontWeight: 700 }}>
                        <Globe size={14} /> {inv.location}
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                    <div><div className="input-label" style={{ fontSize: '0.6rem', marginBottom: '0.25rem' }}>Round</div><div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{inv.round}</div></div>
                    <div><div className="input-label" style={{ fontSize: '0.6rem', marginBottom: '0.25rem' }}>Year</div><div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{inv.year}</div></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .modal-content { 
              animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
              max-height: 90vh; 
              display: flex; 
              flex-direction: column;
            }
            .modal-body { 
              overflow-y: auto; 
              padding-right: 0.5rem;
            }
            .modal-body::-webkit-scrollbar { width: 6px; }
            .modal-body::-webkit-scrollbar-track { background: transparent; }
            .modal-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
            .modal-body::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
            
            .file-upload-zone { border: 2px dashed var(--border); border-radius: 12px; padding: 1.25rem; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg-secondary); }
            .file-upload-zone:hover { border-color: var(--brand-500); background: rgba(99,102,241,0.05); }
            .input-with-icon { position: relative; }
            .input-with-icon i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
            .input-with-icon input, .input-with-icon select { padding-left: 2.6rem; }
          `}</style>
          <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '500px', padding: '1.75rem', position: 'relative' }}>
            {/* Modal Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  {editIndex !== null ? 'Edit Deal' : 'Add New Deal'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>
                  {editIndex !== null ? 'Update your investment details.' : 'Submit a verified investment record.'}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <X size={18} color="var(--text-primary)" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Company Name</label>
                <div className="input-with-icon">
                  <Briefcase size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                  <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="input" placeholder="e.g. SpaceX" style={{ paddingLeft: '2.6rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Sector</label>
                  <select value={form.sector} onChange={e => setForm({...form, sector: e.target.value})} className="input" style={{ appearance: 'none' }}>
                    <option value="">Select Sector</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Round</label>
                  <select value={form.round} onChange={e => setForm({...form, round: e.target.value})} className="input">
                    {ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Amount (₹)</label>
                  <div className="input-with-icon">
                    <DollarSign size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                    <input value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input" placeholder="e.g. 50,00,000" style={{ paddingLeft: '2.6rem' }} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Year</label>
                  <div className="input-with-icon">
                    <Calendar size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                    <input value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="input" placeholder="2023" style={{ paddingLeft: '2.6rem' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Exit Status</label>
                  <select value={form.exitStatus} onChange={e => setForm({...form, exitStatus: e.target.value})} className="input">
                    {EXIT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Website</label>
                  <div className="input-with-icon">
                    <Globe size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                    <input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="input" placeholder="https://..." style={{ paddingLeft: '2.6rem' }} />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Location</label>
                <div className="input-with-icon">
                  <Globe size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="input" placeholder="e.g. San Francisco, CA" style={{ paddingLeft: '2.6rem' }} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Proof of Investment</label>
                <div 
                  className="file-upload-zone"
                  onClick={() => document.getElementById('proof-upload').click()}
                >
                  <Plus size={20} color="var(--brand-500)" style={{ marginBottom: '0.4rem' }} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {form.proofFile ? form.proofFile.name : 'Upload PDF or Image'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Required for verification (Max 5MB)
                  </div>
                  <input 
                    id="proof-upload"
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={e => setForm({...form, proofFile: e.target.files[0]})} 
                    style={{ display: 'none' }} 
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowForm(false)} className="btn-sleek secondary" style={{ flex: 1, height: '44px' }} disabled={saving}>Cancel</button>
              <button onClick={handleAddOrEdit} className="btn-sleek primary" style={{ flex: 1, height: '44px' }} disabled={saving}>
                {saving ? 'Saving...' : editIndex !== null ? 'Update' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.75rem' }}>Remove Investment?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{confirmDelete.companyName}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn-sleek secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={proceedDelete} className="btn-sleek primary" style={{ flex: 1, background: '#f43f5e', boxShadow: '0 4px 12px rgba(244,63,94,0.2)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {showUpgradeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <TrendingUp size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.75rem' }}>Upgrade Your Plan</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              You have reached your limit for adding investments on your current plan. Upgrade to a higher plan to add more and unlock premium features.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowUpgradeModal(false)} className="btn-sleek secondary" style={{ flex: 1 }}>Cancel</button>
              <Link to="/billing" style={{ flex: 1 }}>
                <button className="btn-sleek primary" style={{ width: '100%', justifyContent: 'center', background: '#f59e0b', boxShadow: '0 4px 12px rgba(245,158,11,0.2)' }}>View Plans</button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInvestments;
