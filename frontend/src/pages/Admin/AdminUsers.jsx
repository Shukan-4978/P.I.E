import PieLoader from '../../components/common/PieLoader';
import React, { useState, useEffect } from 'react';
import { 
  Search, Shield, Trash2, Users, Ban, TrendingUp, 
  Mail, Calendar, ChevronRight, UserCircle, 
  ShieldCheck, Filter, MoreHorizontal, UserPlus
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (role) params.append('role', role);
      if (search) params.append('search', search);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users); 
      setTotal(data.total);
    } catch(e) {
      toast.error('Failed to load users');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, [page, role]);

  const handleBlock = async (id, isBlocked) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/block`);
      setUsers(p => p.map(u => u._id === id ? { ...u, isBlocked: data.blocked } : u));
      toast.success(data.message);
    } catch { 
      toast.error('Failed to update user status'); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(p => p.filter(u => u._id !== id));
      toast.success('User permanently deleted');
    } catch { 
      toast.error('Failed to delete user'); 
    }
  };

  const handleUpgrade = async (id, plan) => {
    try {
      await api.put(`/admin/users/${id}/upgrade`, { plan });
      setUsers(p => p.map(u => u._id === id ? { ...u, subscriptionPlan: plan } : u));
      toast.success(`User plan updated to ${plan.toUpperCase()}`);
    } catch { 
      toast.error('Failed to update plan'); 
    }
  };

  const ROLE_CONFIG = { 
    founder: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', label: 'Founder' }, 
    investor: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'Investor' }, 
    admin: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Admin' } 
  };

  const PLAN_CONFIG = { 
    free: { color: 'var(--text-muted)', bg: 'var(--bg-secondary)', label: 'Free' }, 
    plus: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Plus' }, 
    pro: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'Pro' }, 
    premium: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Premium' } 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="white" />
            </div>
            User Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Manage and monitor all {total.toLocaleString()} registered accounts.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && fetchUsers()} 
              placeholder="Search by name or email..." 
              style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', width: '280px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-primary)', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none' }} 
            />
          </div>
          <div style={{ height: '24px', width: '1px', background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select 
              value={role} 
              onChange={e => { setRole(e.target.value); setPage(1); }} 
              style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', paddingRight: '1rem' }}
            >
              <option value="">All Roles</option>
              <option value="founder">Founders</option>
              <option value="investor">Investors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '24px', background: 'var(--bg-card)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem' }}>User Identification</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Role & Status</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Access Tier</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Engagement</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr><td colSpan="8" style={{ padding: '4rem 0' }}><PieLoader /></td></tr>) : (
                users.map(u => {
                  const roleCfg = ROLE_CONFIG[u.role] || { color: '#64748b', bg: '#f1f5f9', label: u.role };
                  const planCfg = PLAN_CONFIG[u.subscriptionPlan || 'free'];
                  
                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }} className="table-row-hover">
                      {/* Identity Column */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ position: 'relative' }}>
                            <img 
                              src={u.avatar ? `${u.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=${roleCfg.color.replace('#','')}&color=fff&size=48`} 
                              style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover', border: '2px solid var(--border)' }} 
                              alt="" 
                            />
                            {u.isBlocked && (
                              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#f43f5e', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-card)' }}>
                                <Ban size={10} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {u.name}
                              {u.role === 'admin' && <ShieldCheck size={14} color="#f59e0b" />}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Status Column */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{ 
                            background: roleCfg.bg, 
                            color: roleCfg.color, 
                            fontSize: '0.7rem', 
                            fontWeight: 800, 
                            padding: '0.3rem 0.75rem', 
                            borderRadius: '8px', 
                            textTransform: 'uppercase',
                            width: 'fit-content'
                          }}>
                            {roleCfg.label}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: u.isBlocked ? '#f43f5e' : '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.isBlocked ? '#f43f5e' : '#10b981' }} />
                            {u.isBlocked ? 'Account Blocked' : 'Active Account'}
                          </span>
                        </div>
                      </td>

                      {/* Access Tier Column */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ 
                            background: planCfg.bg, 
                            color: planCfg.color, 
                            fontSize: '0.75rem', 
                            fontWeight: 900, 
                            padding: '0.4rem 1rem', 
                            borderRadius: '10px', 
                            border: `1px solid ${planCfg.color}33`,
                            width: 'fit-content',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <TrendingUp size={14} />
                            {planCfg.label}
                          </div>
                          <select 
                            value={u.subscriptionPlan || 'free'} 
                            onChange={(e) => handleUpgrade(u._id, e.target.value)}
                            style={{ 
                              fontSize: '0.7rem', 
                              padding: '0.3rem', 
                              borderRadius: '6px', 
                              border: '1px solid var(--border)', 
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-muted)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              outline: 'none',
                              maxWidth: '120px'
                            }}
                          >
                            <option value="free">Switch to Free</option>
                            <option value="plus">Upgrade to Plus</option>
                            <option value="pro">Upgrade to Pro</option>
                            <option value="premium">Upgrade to Premium</option>
                          </select>
                        </div>
                      </td>

                      {/* Engagement Column */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <Calendar size={14} /> {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : ''}
                          </div>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleBlock(u._id, u.isBlocked)} 
                            style={{ 
                              padding: '0.6rem', 
                              borderRadius: '12px', 
                              background: u.isBlocked ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.05)', 
                              color: u.isBlocked ? '#10b981' : '#f43f5e', 
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title={u.isBlocked ? 'Unblock Account' : 'Restrict Account'}
                          >
                            {u.isBlocked ? <Shield size={18} /> : <Ban size={18} />}
                          </button>
                          <button 
                            onClick={() => handleDelete(u._id)} 
                            style={{ 
                              padding: '0.6rem', 
                              borderRadius: '12px', 
                              background: 'rgba(244,63,94,0.1)', 
                              color: '#f43f5e', 
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title="Delete Permanently"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <button 
            onClick={() => setPage(p => Math.max(1, p-1))} 
            className="btn-secondary" 
            disabled={page === 1} 
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Previous
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 800 }}>Page {page}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>of {Math.ceil(total / 20) || 1}</span>
          </div>
          <button 
            onClick={() => setPage(p => p+1)} 
            className="btn-secondary" 
            disabled={users.length < 20} 
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Next
          </button>
        </div>
      </div>

      <style>{`
        .table-row-hover:hover {
          background: rgba(99,102,241,0.02) !important;
        }
        select:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.1);
        }
        button:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
};

export default AdminUsers;
