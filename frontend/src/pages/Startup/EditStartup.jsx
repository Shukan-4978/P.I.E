import PieLoader from '../../components/common/PieLoader';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Rocket, ChevronRight, ChevronLeft, Plus, X, Check, Edit, Image as ImageIcon, Upload } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import LocationInput from '../../components/LocationInput';

const INDUSTRIES = ['fintech','healthtech','edtech','saas','ecommerce','ai-ml','cleantech','logistics','real-estate','other'];
const STAGES = ['idea','mvp','pre-seed','seed','series-a','series-b','growth'];
const STEPS = ['Basic Info','Problem & Solution','Team & Traction','Review'];

const EditStartup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ title:'', tagline:'', description:'', problem:'', solution:'', industry:'saas', stage:'mvp', location:'', fundingGoal:'', valuation:'', equity:'', website:'', teamMembers:[], traction:{ revenue:0, users:0, growthRate:0 }, tags:[] });
  
  const [images, setImages] = useState([]);
  const [logo, setLogo] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [newMember, setNewMember] = useState({ name:'', role:'', linkedIn:'' });

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const { data } = await api.get(`/startups/${id}`);
        setForm({
          title: data.title || '',
          tagline: data.tagline || '',
          description: data.description || '',
          problem: data.problem || '',
          solution: data.solution || '',
          industry: data.industry || 'saas',
          stage: data.stage || 'mvp',
          location: data.location || '',
          fundingGoal: data.fundingGoal || '',
          valuation: data.valuation || '',
          equity: data.equity || '',
          website: data.website || '',
          teamMembers: data.teamMembers || [],
          traction: data.traction || { revenue: 0, users: 0, growthRate: 0 },
          tags: data.tags || []
        });
      } catch (err) {
        toast.error('Failed to fetch startup details');
        navigate('/dashboard');
      } finally {
        setFetching(false);
      }
    };
    fetchStartup();
  }, [id, navigate]);

  const u = (f,v) => setForm(p=>({...p,[f]:v}));
  const ut = (f,v) => setForm(p=>({...p,traction:{...p.traction,[f]:v}}));

  const addTag = (e) => {
    if (e.key==='Enter'&&tagInput.trim()) { e.preventDefault(); if(!form.tags.includes(tagInput.trim())) u('tags',[...form.tags,tagInput.trim()]); setTagInput(''); }
  };
  const addMember = () => {
    if(newMember.name&&newMember.role) { u('teamMembers',[...form.teamMembers,{...newMember}]); setNewMember({name:'',role:'',linkedIn:''}); }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length < files.length) {
      toast.error('Only images are allowed in the Gallery.');
    }
    setImages(validImages);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.type.startsWith('image/')) {
      toast.error('Please select an image file for the logo.');
      e.target.value = '';
      return;
    }
    setLogo(file);
  };

  const canProceed = () => {
    if(step===0) return form.title&&form.tagline&&form.description;
    if(step===1) return form.problem&&form.solution;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title',form.title); fd.append('tagline',form.tagline);
      fd.append('description',form.description); fd.append('problem',form.problem);
      fd.append('solution',form.solution); fd.append('industry',form.industry);
      fd.append('stage',form.stage); fd.append('location',form.location);
      fd.append('fundingGoal',form.fundingGoal); fd.append('valuation',form.valuation);
      fd.append('equity',form.equity); fd.append('website',form.website);
      fd.append('teamMembers',JSON.stringify(form.teamMembers));
      fd.append('traction',JSON.stringify(form.traction));
      fd.append('tags',JSON.stringify(form.tags));
      
      if (logo) fd.append('logo', logo);
      images.forEach(img=>fd.append('images',img));
      
      await api.put(`/startups/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Startup updated successfully!');
      navigate(`/startups/${id}`);
    } catch(err) {
      toast.error(err.response?.data?.error || 'Failed to update startup');
    } finally {
      setLoading(false);
    }
  };

  const lbl = (t) => <label style={{fontSize:'0.85rem',fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:'0.4rem'}}>{t}</label>;

  if (fetching) return <PieLoader />;

  return (
    <div style={{maxWidth:'640px',margin:'0 auto', paddingBottom: '4rem'}}>
      <div style={{marginBottom:'2.5rem'}}>
        <h1 style={{fontSize:'2rem',fontWeight:900,marginBottom:'0.5rem',display:'flex',alignItems:'center',gap:'0.75rem', letterSpacing: '-0.02em'}}><Edit size={32} color="#6366f1"/> Edit Startup</h1>
        <p style={{color:'var(--text-secondary)'}}>Update your startup profile information.</p>
      </div>

      <div style={{display:'flex',marginBottom:'2.5rem',alignItems:'center', background: 'var(--bg-card)', padding: '1rem', borderRadius: '20px', border: '1px solid var(--border)'}}>
        {STEPS.map((s,i)=>(
          <React.Fragment key={i}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',flex: 1}}>
              <div style={{width:'36px',height:'36px',borderRadius:'50%',background:i<step?'#10b981':i===step?'#6366f1':'var(--bg-tertiary)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {i<step?<Check size={18} color="white"/>:<span style={{fontSize:'0.9rem',fontWeight:800,color:i===step?'white':'var(--text-muted)'}}>{i+1}</span>}
              </div>
              <div style={{fontSize:'0.7rem',fontWeight:700,marginTop:'0.5rem',color:i===step?'#6366f1':'var(--text-muted)',textAlign:'center', textTransform: 'uppercase'}}>{s}</div>
            </div>
            {i<STEPS.length-1&&<div style={{width:'20px',height:'2px',background:i<step?'#10b981':'var(--border)',margin:'0 4px', marginBottom: '1.2rem'}}/>}
          </React.Fragment>
        ))}
      </div>

      <div className="card" style={{padding:'2.5rem', borderRadius: '24px'}}>
        {step===0&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            <h2 style={{fontSize:'1.25rem',fontWeight:800}}>Basic Information</h2>
            <div>{lbl('Startup Name *')}<input value={form.title} onChange={e=>u('title',e.target.value)} placeholder="e.g. NovaMed AI" className="input"/></div>
            <div>{lbl('Tagline *')}<input value={form.tagline} onChange={e=>u('tagline',e.target.value)} placeholder="One sentence that describes your startup" className="input"/></div>
            <div>{lbl('Description *')}<textarea value={form.description} onChange={e=>u('description',e.target.value)} placeholder="Describe your startup in detail..." className="input" style={{minHeight: '120px'}}/></div>
            
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div>{lbl('Industry *')}<select value={form.industry} onChange={e=>u('industry',e.target.value)} className="input">{INDUSTRIES.map(i=><option key={i} value={i}>{i.toUpperCase()}</option>)}</select></div>
              <div>{lbl('Stage *')}<select value={form.stage} onChange={e=>u('stage',e.target.value)} className="input">{STAGES.map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem'}}>
              <div>{lbl('Funding Goal (₹)')}<input type="number" value={form.fundingGoal} onChange={e=>u('fundingGoal',e.target.value)} placeholder="500000" className="input"/></div>
              <div>{lbl('Valuation (₹)')}<input type="number" value={form.valuation} onChange={e=>u('valuation',e.target.value)} placeholder="2000000" className="input"/></div>
              <div>{lbl('Equity (%)')}<input type="number" value={form.equity} onChange={e=>u('equity',e.target.value)} placeholder="10" className="input"/></div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div>{lbl('Location')}<LocationInput value={form.location} onChange={val=>u('location',val)} /></div>
              <div>{lbl('Website')}<input value={form.website} onChange={e=>u('website',e.target.value)} placeholder="https://example.com" className="input"/></div>
            </div>

            <div style={{ border: '1px dashed var(--border)', padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
              {lbl('Update Logo')}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {logo ? <img src={URL.createObjectURL(logo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="logo" /> : <ImageIcon size={24} color="var(--text-muted)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} id="logo-upload-edit" />
                  <label htmlFor="logo-upload-edit" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <Upload size={14} /> Choose New Logo
                  </label>
                </div>
              </div>
            </div>

            <div>
              {lbl('Gallery Images (Max 5)')}
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="input" style={{paddingTop:'0.5rem'}}/>
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={URL.createObjectURL(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="gallery" />
                      <button onClick={() => setImages(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(244,63,94,0.8)', border: 'none', color: 'white', padding: '2px', cursor: 'pointer' }}><X size={12}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step===1&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            <h2 style={{fontSize:'1.25rem',fontWeight:800}}>Problem & Solution</h2>
            <div>{lbl('Problem Statement *')}<textarea value={form.problem} onChange={e=>u('problem',e.target.value)} placeholder="What problem are you solving? Who faces it?" className="input" style={{minHeight:'140px'}}/></div>
            <div>{lbl('Your Solution *')}<textarea value={form.solution} onChange={e=>u('solution',e.target.value)} placeholder="How does your product/service solve this problem?" className="input" style={{minHeight:'140px'}}/></div>
          </div>
        )}

        {step===2&&(
          <div style={{display:'flex',flexDirection:'column',gap:'2rem'}}>
            <div>
              <h2 style={{fontSize:'1.25rem',fontWeight:800,marginBottom:'1rem'}}>Traction Metrics</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
                <div>{lbl('Revenue (₹)')}<input type="number" value={form.traction.revenue} onChange={e=>ut('revenue',Number(e.target.value))} className="input"/></div>
                <div>{lbl('Users')}<input type="number" value={form.traction.users} onChange={e=>ut('users',Number(e.target.value))} className="input"/></div>
                <div>{lbl('Growth Rate (%)')}<input type="number" value={form.traction.growthRate} onChange={e=>ut('growthRate',Number(e.target.value))} className="input"/></div>
              </div>
            </div>
            <div>
              <h2 style={{fontSize:'1.25rem',fontWeight:800,marginBottom:'1rem'}}>Team Members</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {form.teamMembers.map((m,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'1rem',background:'var(--bg-secondary)',borderRadius:'16px',border:'1px solid var(--border)'}}>
                    <div style={{flex:1}}><div style={{fontWeight:800,fontSize:'0.9rem'}}>{m.name}</div><div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{m.role}</div></div>
                    <button onClick={()=>u('teamMembers',form.teamMembers.filter((_,j)=>j!==i))} className="btn-ghost" style={{padding:'0.4rem',color:'#f43f5e'}}><X size={18}/></button>
                  </div>
                ))}
              </div>
              <div style={{background:'var(--bg-secondary)',padding:'1.25rem',borderRadius:'20px',border:'1px solid var(--border)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div style={{ gridColumn: 'span 2' }}>{lbl('Name')}<input value={newMember.name} onChange={e=>setNewMember(p=>({...p,name:e.target.value}))} className="input" placeholder="Jane Doe"/></div>
                <div>{lbl('Role')}<input value={newMember.role} onChange={e=>setNewMember(p=>({...p,role:e.target.value}))} className="input" placeholder="CTO"/></div>
                <div>{lbl('LinkedIn')}<input value={newMember.linkedIn} onChange={e=>setNewMember(p=>({...p,linkedIn:e.target.value}))} className="input" placeholder="linkedin.com/in/..."/></div>
                <button onClick={addMember} className="btn-secondary" style={{ gridColumn: 'span 2', justifyContent: 'center' }}><Plus size={18}/> Add Member</button>
              </div>
            </div>
          </div>
        )}

        {step===3&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            <h2 style={{fontSize:'1.25rem',fontWeight:800}}>Review & Save</h2>
            <div style={{background:'var(--bg-secondary)',borderRadius:'20px',padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem', border: '1px solid var(--border)'}}>
              {[{l:'Name',v:form.title},{l:'Industry',v:form.industry},{l:'Stage',v:form.stage},{l:'Funding Goal',v:form.fundingGoal?`₹${Number(form.fundingGoal).toLocaleString()}`:'—'},{l:'Team',v:`${form.teamMembers.length} member(s)`}].map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'0.95rem',borderBottom:i<4?'1px solid var(--border-subtle)':'none',paddingBottom:i<4?'0.75rem':'0'}}>
                  <span style={{color:'var(--text-muted)',fontWeight:600}}>{r.l}</span>
                  <span style={{color:'var(--text-primary)',fontWeight:800}}>{r.v||'—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:'flex',justifyContent:'space-between',marginTop:'2.5rem',paddingTop:'1.5rem',borderTop:'1px solid var(--border)'}}>
          <button onClick={()=>setStep(p=>p-1)} className="btn-secondary" disabled={step===0}><ChevronLeft size={18}/> Back</button>
          {step<STEPS.length-1
            ? <button onClick={()=>setStep(p=>p+1)} className="btn-primary" disabled={!canProceed()}>Next <ChevronRight size={18}/></button>
            : <button onClick={handleSubmit} className="btn-primary" disabled={loading || !canProceed()}>{loading?'Updating...':<><Rocket size={18}/> Update Startup</>}</button>
          }
        </div>
      </div>
    </div>
  );
};

export default EditStartup;
