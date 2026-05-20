import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, CheckCircle, AlertCircle, Phone, Mail, 
  User, Users, Shield, Tag, X, Bell, Mail as MailIcon, MessageSquare, 
  DollarSign, Brain, Heart, Globe, ChevronRight, Camera, Upload, Lock, FileText
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const industryList = ["AI", "Fintech", "Health", "Logistic", "SaaS", "E-commerce", "CleanTech", "PropTech", "EdTech", "Entertainment", "Cybersecurity", "Blockchain"];

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile'); 

  const avatarInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? `http://localhost:5000${user.avatar}` : null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', bio: user?.bio || '', location: user?.location || '',
    website: user?.website || '', linkedIn: user?.linkedIn || '', twitter: user?.twitter || '',
    phone: user?.phone || '', industries: user?.industries || []
  });

  const [notifSettings, setNotifSettings] = useState(user?.notificationSettings || {
    all: true, email: true, offers: true, messages: true, activity: true, aiReports: true
  });

  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [emailStatus, setEmailStatus] = useState(user?.isEmailVerified ? 'verified' : 'unverified'); 
  const [phoneStatus, setPhoneStatus] = useState(user?.isPhoneVerified ? 'verified' : 'unverified');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(profileForm).forEach(key => {
        if (key === 'industries') {
          formData.append(key, JSON.stringify(profileForm[key]));
        } else {
          formData.append(key, profileForm[key]);
        }
      });
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const { data } = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      updateUser(data);
      toast.success('Profile updated successfully');
      setAvatarFile(null);
    } catch (err) { 
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update profile'); 
    }
    finally { setLoading(false); }
  };

  const handleNotifSave = async (updatedSettings) => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', {
        notificationSettings: updatedSettings || notifSettings
      });
      updateUser(data);
      toast.success('Notification preferences updated');
    } catch (err) { toast.error('Failed to update preferences'); }
    finally { setLoading(false); }
  };

  const toggleNotif = (key) => {
    const newVal = !notifSettings[key];
    const updated = { ...notifSettings, [key]: newVal };
    setNotifSettings(updated);
    handleNotifSave(updated);
  };

  const toggleIndustry = (ind) => {
    setProfileForm(p => {
      const exists = p.industries.includes(ind);
      if (exists) {
        return { ...p, industries: p.industries.filter(i => i !== ind) };
      } else {
        return { ...p, industries: [...p.industries, ind] };
      }
    });
  };

  const handleEmailRequest = async () => {
    try {
      await api.post('/auth/verify/email/request');
      setEmailStatus('requested');
      toast.success('Code sent to your email!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to request code'); }
  };

  const handleEmailConfirm = async () => {
    try {
      const { data } = await api.post('/auth/verify/email/confirm', { code: emailCode });
      updateUser(data.user);
      setEmailStatus('verified');
      toast.success('Email verified successfully!');
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid code'); }
  };

  const handlePhoneRequest = async () => {
    if (!profileForm.phone) return toast.error('Please enter and save a phone number first');
    try {
      if (profileForm.phone !== user.phone) {
        await api.put('/auth/profile', { phone: profileForm.phone });
        updateUser({ ...user, phone: profileForm.phone });
      }
      await api.post('/auth/verify/phone/request', { phone: profileForm.phone });
      setPhoneStatus('requested');
      toast.success('Code sent to your phone!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to request code'); }
  };

  const handlePhoneConfirm = async () => {
    try {
      const { data } = await api.post('/auth/verify/phone/confirm', { code: phoneCode });
      updateUser(data.user);
      setPhoneStatus('verified');
      toast.success('Phone verified successfully!');
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid code'); }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '4rem' }}>
      <style>{`
        .settings-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2.5rem;
        }
        @media (max-width: 900px) {
          .settings-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
        .settings-sidebar {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.01);
          height: fit-content;
        }
        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.85rem 1.25rem;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 0.9rem;
          position: relative;
          overflow: hidden;
        }
        .settings-nav-item:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
          padding-left: 1.5rem;
        }
        .settings-nav-item.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
          color: #6366f1;
          border-left: 4px solid #6366f1;
          padding-left: 1.5rem;
        }
        .settings-nav-item.danger {
          color: #f43f5e;
        }
        .settings-nav-item.danger:hover {
          background: rgba(244, 63, 94, 0.05);
          color: #ef4444;
        }
        .settings-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 2.5rem;
          box-shadow: 0 15px 35px rgba(0,0,0,0.02);
          backdrop-filter: blur(8px);
        }
        .settings-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .settings-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .settings-input-icon {
          position: absolute;
          left: 1.25rem;
          color: var(--text-muted);
          pointer-events: none;
          transition: color 0.2s;
        }
        .settings-input {
          width: 100%;
          padding: 0.85rem 1.25rem 0.85rem 3rem !important;
          background: var(--bg-secondary) !important;
          border: 1.5px solid var(--border) !important;
          border-radius: 16px !important;
          color: var(--text-primary) !important;
          font-size: 0.9rem !important;
          font-weight: 600 !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .settings-input:focus {
          border-color: #6366f1 !important;
          background: var(--bg-card) !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12) !important;
          outline: none !important;
        }
        .settings-input:focus + .settings-input-icon {
          color: #6366f1;
        }
        .settings-textarea {
          width: 100%;
          min-height: 120px;
          padding: 1.25rem 1.25rem 1.25rem 3.2rem !important;
          background: var(--bg-secondary) !important;
          border: 1.5px solid var(--border) !important;
          border-radius: 20px !important;
          color: var(--text-primary) !important;
          font-size: 0.9rem !important;
          font-weight: 600 !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          resize: vertical;
        }
        .settings-textarea:focus {
          border-color: #6366f1 !important;
          background: var(--bg-card) !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12) !important;
          outline: none !important;
        }
        .settings-textarea:focus + .settings-input-icon {
          color: #6366f1;
        }
        .settings-badge {
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          border: 1.5px solid var(--border);
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }
        .settings-badge:hover {
          border-color: #6366f1;
          color: var(--text-primary);
          background: var(--bg-card);
        }
        .settings-badge.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
        }
        .toggle-switch {
          position: relative;
          width: 48px;
          height: 24px;
          background: var(--bg-tertiary);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          border: 1px solid var(--border);
        }
        .toggle-switch.active {
          background: #6366f1;
          border-color: #6366f1;
        }
        .toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .toggle-switch.active .toggle-knob {
          left: 26px;
        }
        .avatar-upload-container {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto;
          cursor: pointer;
        }
        .avatar-upload-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          color: white;
        }
        .avatar-upload-container:hover .avatar-upload-overlay {
          opacity: 1;
        }
      `}</style>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
          <SettingsIcon size={32} color="#6366f1" /> Platform Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Configure your profile, security, and notification preferences.</p>
      </div>

      <div className="settings-container">
        
        {/* Sidebar Nav */}
        <div className="settings-sidebar">
          <div className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
            <User size={18} /> Edit Profile
          </div>
          <div className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabChange('notifications')}>
            <Bell size={18} /> Notifications
          </div>
          <div className={`settings-nav-item ${activeTab === 'verification' ? 'active' : ''}`} onClick={() => handleTabChange('verification')}>
            <Shield size={18} /> Account Verification
          </div>
          <div className={`settings-nav-item ${activeTab === 'subscription' ? 'active' : ''}`} onClick={() => handleTabChange('subscription')}>
            <DollarSign size={18} /> Subscription Quota
          </div>
          <div className={`settings-nav-item ${activeTab === 'legal' ? 'active' : ''}`} onClick={() => handleTabChange('legal')}>
            <FileText size={18} /> Legal & Privacy
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />
          <div className="settings-nav-item danger">
            <AlertCircle size={18} /> Danger Zone
          </div>
        </div>

        {/* Content Area */}
        <div className="settings-card">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-0.01em' }}>Profile Information</h2>
              
              <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                
                {/* Avatar Upload */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div className="avatar-upload-container" onClick={() => avatarInputRef.current.click()}>
                    <img 
                      src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff&size=120`} 
                      style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-secondary)', boxShadow: '0 8px 30px rgba(99, 102, 241, 0.15)', transition: 'all 0.3s' }} 
                      alt="Profile" 
                    />
                    <div className="avatar-upload-overlay">
                      <Camera size={24} />
                    </div>
                    <input 
                      type="file" 
                      ref={avatarInputRef} 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                    />
                    {avatarFile && (
                      <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: 'white', padding: '3px 10px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>
                        NEW IMAGE
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="settings-input-group">
                    <label className="label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Full Name</label>
                    <div className="settings-input-wrapper">
                      <input className="settings-input" value={profileForm.name} onChange={e => setProfileForm(p => ({...p, name: e.target.value}))} required />
                      <User className="settings-input-icon" size={16} />
                    </div>
                  </div>
                  <div className="settings-input-group">
                    <label className="label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Location</label>
                    <div className="settings-input-wrapper">
                      <input className="settings-input" value={profileForm.location} onChange={e => setProfileForm(p => ({...p, location: e.target.value}))} placeholder="London, UK" />
                      <Globe className="settings-input-icon" size={16} />
                    </div>
                  </div>
                </div>
                
                <div className="settings-input-group">
                  <label className="label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Industry Focus</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '20px', border: '1.5px solid var(--border)' }}>
                    {industryList.map(ind => {
                      const isSelected = profileForm.industries.includes(ind);
                      return (
                        <button key={ind} type="button" onClick={() => toggleIndustry(ind)} className={`settings-badge ${isSelected ? 'active' : ''}`}>
                          {ind} {isSelected && <X size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="settings-input-group">
                  <label className="label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Bio</label>
                  <div className="settings-input-wrapper">
                    <textarea className="settings-textarea" value={profileForm.bio} onChange={e => setProfileForm(p => ({...p, bio: e.target.value}))} placeholder="Describe yourself or your company..." />
                    <FileText className="settings-input-icon" size={16} style={{ top: '1.25rem' }} />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="settings-input-group">
                    <label className="label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Website</label>
                    <div className="settings-input-wrapper">
                      <input className="settings-input" value={profileForm.website} onChange={e => setProfileForm(p => ({...p, website: e.target.value}))} placeholder="https://" />
                      <Globe className="settings-input-icon" size={16} />
                    </div>
                  </div>
                  <div className="settings-input-group">
                    <label className="label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>LinkedIn URL</label>
                    <div className="settings-input-wrapper">
                      <input className="settings-input" value={profileForm.linkedIn} onChange={e => setProfileForm(p => ({...p, linkedIn: e.target.value}))} placeholder="https://linkedin.com/in/..." />
                      <User className="settings-input-icon" size={16} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: '52px', fontSize: '0.95rem', fontWeight: 800, borderRadius: '18px', boxShadow: '0 8px 25px rgba(99,102,241,0.25)' }} disabled={loading}>
                    {loading ? 'Saving Changes...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.01em', margin: 0 }}>Notification Preferences</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Choose what updates you want to receive.</p>
                </div>
                <div className={`toggle-switch ${notifSettings.all ? 'active' : ''}`} onClick={() => toggleNotif('all')} style={{ boxShadow: notifSettings.all ? '0 0 15px rgba(99, 102, 241, 0.3)' : 'none' }}>
                  <div className="toggle-knob" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', opacity: notifSettings.all ? 1 : 0.5, pointerEvents: notifSettings.all ? 'all' : 'none', transition: 'all 0.3s' }}>
                {[
                  { id: 'email', label: 'Email Notifications', desc: 'Receive critical updates via your registered email.', icon: <MailIcon size={20} color="#6366f1" />, bg: 'rgba(99,102,241,0.08)' },
                  { id: 'offers', label: 'Investment Offers', desc: 'Get notified when someone sends you a funding proposal.', icon: <DollarSign size={20} color="#f59e0b" />, bg: 'rgba(245,158,11,0.08)' },
                  { id: 'messages', label: 'Chat Messages', desc: 'Alerts for new private messages and connection requests.', icon: <MessageSquare size={20} color="#10b981" />, bg: 'rgba(16,185,129,0.08)' },
                  { id: 'aiReports', label: 'AI Pitch Reports', desc: 'Notifications when your AI analysis is ready for review.', icon: <Brain size={20} color="#8b5cf6" />, bg: 'rgba(139,92,246,0.08)' },
                  { id: 'activity', label: 'Social Activity', desc: 'Alerts for likes, comments, and profile mentions.', icon: <Heart size={20} color="#f43f5e" />, bg: 'rgba(244,63,94,0.08)' },
                ].map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)', transition: 'all 0.2s hover' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.05)' }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>{item.desc}</div>
                    </div>
                    <div className={`toggle-switch ${notifSettings[item.id] ? 'active' : ''}`} onClick={() => toggleNotif(item.id)} style={{ boxShadow: notifSettings[item.id] ? '0 0 10px rgba(99,102,241,0.2)' : 'none' }}>
                      <div className="toggle-knob" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'verification' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-0.01em' }}>Verification Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1.75rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                  {emailStatus === 'verified' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: '#10b981' }} />
                  )}
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.85rem', background: 'rgba(99,102,241,0.08)', borderRadius: '16px', color: '#6366f1', display: 'flex' }}><MailIcon size={26} /></div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>Email Verification</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>{user?.email}</div>
                    </div>
                  </div>
                  {emailStatus === 'verified' ? (
                    <span className="badge badge-success" style={{ padding: '0.5rem 1.25rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.8rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}><CheckCircle size={14} /> Verified</span>
                  ) : emailStatus === 'requested' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        placeholder="Enter Code" 
                        className="input" 
                        style={{ width: '130px', height: '44px', borderRadius: '12px', textAlign: 'center', letterSpacing: '1px', fontWeight: 800 }} 
                        value={emailCode} 
                        onChange={(e) => setEmailCode(e.target.value)} 
                      />
                      <button onClick={handleEmailConfirm} className="btn-primary" style={{ height: '44px', padding: '0 1.25rem', borderRadius: '12px', fontWeight: 800 }}>Confirm</button>
                    </div>
                  ) : (
                    <button onClick={handleEmailRequest} className="btn-secondary" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 800 }}>Verify Now</button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'subscription' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.01em', margin: 0 }}>Subscription & Quota</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Track your monthly limits and active plan.</p>
                </div>
                <div className="badge badge-brand" style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem', fontWeight: 800, borderRadius: '14px', textTransform: 'capitalize', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(99,102,241,0.25)' }}>
                  {user?.subscriptionPlan || 'Free'} Plan
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {[
                  { label: 'Connections', icon: <Users size={18} />, used: user?.usageStats?.connectionsMonth?.count || 0, total: user?.subscriptionPlan === 'free' ? 5 : user?.subscriptionPlan === 'plus' ? 10 : user?.subscriptionPlan === 'pro' ? 20 : '∞', period: 'month', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
                  { label: 'Daily Messages', icon: <MessageSquare size={18} />, used: user?.usageStats?.messagesToday?.count || 0, total: user?.subscriptionPlan === 'free' ? 10 : user?.subscriptionPlan === 'plus' ? 25 : user?.subscriptionPlan === 'pro' ? 100 : '∞', period: 'day', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                  { label: 'Posts', icon: <Tag size={18} />, used: user?.usageStats?.postsMonth?.count || 0, total: user?.subscriptionPlan === 'free' ? 2 : user?.subscriptionPlan === 'plus' ? 5 : user?.subscriptionPlan === 'pro' ? 10 : '∞', period: 'month', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                  { label: 'Startups/Investments', icon: <DollarSign size={18} />, used: user?.usageStats?.startupsMonth?.count || user?.usageStats?.investmentsMonth?.count || 0, total: user?.subscriptionPlan === 'free' ? 1 : user?.subscriptionPlan === 'plus' ? 2 : user?.subscriptionPlan === 'pro' ? 5 : '∞', period: 'month', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                  { label: 'AI Analysis', icon: <Brain size={18} />, used: user?.usageStats?.aiAnalysisMonth?.count || 0, total: user?.subscriptionPlan === 'free' ? 0 : user?.subscriptionPlan === 'plus' ? 5 : user?.subscriptionPlan === 'pro' ? 10 : '∞', period: 'month', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
                  { label: 'AI Advisor', icon: <Brain size={18} />, used: user?.usageStats?.aiAdvisorMessagesMonth?.count || 0, total: user?.subscriptionPlan === 'pro' ? 10 : user?.subscriptionPlan === 'premium' ? '∞' : 0, period: 'month', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--bg-secondary)', padding: '1.75rem', borderRadius: '24px', border: '1.5px solid var(--border)', opacity: item.total === 0 ? 0.6 : 1, position: 'relative', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
                      <div style={{ padding: '0.4rem', background: item.bg, borderRadius: '10px', color: item.color, display: 'flex' }}>{item.icon}</div> 
                      <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{item.label}</span>
                      {item.total === 0 && <Lock size={12} style={{ marginLeft: 'auto', color: '#f59e0b' }} />}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900 }}>{item.used}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>of {item.total === 0 ? 'Locked' : item.total} / {item.period}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: item.total === '∞' ? '100%' : item.total === 0 ? '0%' : `${Math.min(100, (item.used / (item.total || 1)) * 100)}%`, 
                        height: '100%', 
                        background: (item.used >= item.total && item.total !== '∞' && item.total !== 0) ? '#f43f5e' : item.color,
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2.5rem', background: 'rgba(99,102,241,0.04)', borderRadius: '28px', border: '1.5px dashed rgba(99,102,241,0.2)' }}>
                <p style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>Need more quota for your business?</p>
                <button onClick={() => navigate('/pricing')} className="btn-primary" style={{ padding: '0.75rem 2.25rem', borderRadius: '14px', fontWeight: 800, boxShadow: '0 4px 15px rgba(99,102,241,0.2)' }}>Upgrade Your Plan</button>
              </div>
            </motion.div>
          )}

          {activeTab === 'legal' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-0.01em' }}>Legal & Privacy</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1.75rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.08)', borderRadius: '16px', color: '#10b981', display: 'flex' }}><CheckCircle size={24} /></div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>Terms of Service</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>
                        You agreed on {user?.agreedAt ? new Date(user.agreedAt).toLocaleDateString() : 'Account Creation'}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate('/terms')} className="btn-secondary" style={{ borderRadius: '12px', fontWeight: 800, padding: '0.6rem 1.5rem' }}>View Terms</button>
                </div>

                <div style={{ padding: '1.75rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: '16px', color: '#6366f1', display: 'flex' }}><Shield size={24} /></div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>Privacy Policy</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>How we handle your data.</div>
                    </div>
                  </div>
                  <button onClick={() => navigate('/privacy')} className="btn-secondary" style={{ borderRadius: '12px', fontWeight: 800, padding: '0.6rem 1.5rem' }}>View Policy</button>
                </div>

                <div style={{ marginTop: '1rem', padding: '1.75rem', background: 'rgba(244, 63, 94, 0.04)', borderRadius: '24px', border: '1.5px solid rgba(244, 63, 94, 0.1)' }}>
                  <h4 style={{ color: '#f43f5e', fontSize: '1.05rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /> Data Portability</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                    You have the right to request a copy of your personal data or request deletion of your account. For these requests, please contact our support team.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Settings;
