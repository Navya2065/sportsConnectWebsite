import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Profile.css';

/* ─── Profile Page ────────────────────────────────────────────── */
const Profile = () => {
  const { user, updateUser } = useAuth();

  /* ── Edit Profile form state ──── */
  const [form, setForm] = useState({
    name:             user?.name || '',
    bio:              user?.bio || '',
    location:         user?.location || '',
    sport:            user?.sport || '',
    company:          user?.company || '',
    industry:         user?.industry || '',
    website:          user?.website || '',
    sponsorshipBudget:user?.sponsorshipBudget || '',
    socialLinks: {
      instagram: user?.socialLinks?.instagram || '',
      twitter:   user?.socialLinks?.twitter || '',
      youtube:   user?.socialLinks?.youtube || '',
    },
    interestedSports: user?.interestedSports?.join(', ') || '',
    achievements:     user?.achievements?.join(', ') || '',
    // Stats
    engagementRate: user?.stats?.engagementRate || '',
    monthlyViews:   user?.stats?.monthlyViews || '',
    // Asking price
    askingPriceMin: user?.askingPriceMin || '',
    askingPriceMax: user?.askingPriceMax || '',
    priceCurrency:  user?.priceCurrency || 'INR',
  });

  /* ── Media Kit state ──── */
  const [mkForm, setMkForm] = useState({
    headline:     user?.mediaKit?.headline || '',
    highlights:   user?.mediaKit?.highlights?.join('\n') || '',
    pricing:      user?.mediaKit?.pricing || '',
    availability: user?.mediaKit?.availability || '',
  });

  /* ── Previous sponsors state ──── */
  const [prevSponsors, setPrevSponsors] = useState(
    user?.previousSponsors || []
  );
  const [newSponsor, setNewSponsor] = useState({ brandName: '', year: '', description: '' });
  const [addingBrand, setAddingBrand] = useState(false);

  /* ── Portfolio state ──── */
  const [portfolio, setPortfolio]       = useState(user?.portfolioMedia || []);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [deletingMedia, setDeletingMedia]   = useState(null);
  const mediaInputRef = useRef(null);

  /* ── Tab / loading state ──── */
  const [tab,      setTab]      = useState('profile');
  const [saving,   setSaving]   = useState(false);
  const [mkSaving, setMkSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* ── Password change state ──── */
  const [pwForm,   setPwForm]   = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const fileInputRef = useRef(null);
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  /* ─── Handlers ─────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social_')) {
      const key = name.replace('social_', '');
      setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [key]: value } }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        interestedSports: form.interestedSports.split(',').map(s => s.trim()).filter(Boolean),
        achievements:     form.achievements.split(',').map(s => s.trim()).filter(Boolean),
        stats: {
          engagementRate: parseFloat(form.engagementRate) || 0,
          monthlyViews:   parseInt(form.monthlyViews) || 0,
        },
        askingPriceMin: parseFloat(form.askingPriceMin) || 0,
        askingPriceMax: parseFloat(form.askingPriceMax) || 0,
        priceCurrency:  form.priceCurrency,
      };
      // Remove flat stat fields from top-level
      delete payload.engagementRate;
      delete payload.monthlyViews;

      const { data } = await api.put('/users/profile/update', payload);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);
    try {
      const { data } = await api.post('/users/avatar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Min 6 characters');
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  /* ── Media Kit save ──────────────────────────────── */
  const handleMkSave = async (e) => {
    e.preventDefault();
    setMkSaving(true);
    try {
      const payload = {
        mediaKit: {
          headline:     mkForm.headline.trim(),
          highlights:   mkForm.highlights.split('\n').map(h => h.trim()).filter(Boolean),
          pricing:      mkForm.pricing.trim(),
          availability: mkForm.availability.trim(),
        },
        previousSponsors: prevSponsors,
      };
      const { data } = await api.put('/users/profile/update', payload);
      updateUser(data.user);
      toast.success('Media kit saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save media kit');
    } finally {
      setMkSaving(false);
    }
  };

  /* ── Previous sponsor management ─────────────────── */
  const handleAddBrand = () => {
    if (!newSponsor.brandName.trim()) return toast.error('Brand name required');
    setPrevSponsors(prev => [...prev, { ...newSponsor }]);
    setNewSponsor({ brandName: '', year: '', description: '' });
    setAddingBrand(false);
  };

  const handleRemoveBrand = (i) => {
    setPrevSponsors(prev => prev.filter((_, idx) => idx !== i));
  };

  /* ── Portfolio upload ────────────────────────────── */
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (portfolio.length + files.length > 12) {
      return toast.error('Max 12 portfolio items allowed');
    }
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('media', f));
      const { data } = await api.post('/users/portfolio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPortfolio(data.user.portfolioMedia);
      updateUser(data.user);
      toast.success(`${files.length} file(s) uploaded!`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    setDeletingMedia(mediaId);
    try {
      const { data } = await api.delete(`/users/portfolio/${mediaId}`);
      setPortfolio(data.user.portfolioMedia);
      updateUser(data.user);
      toast.success('Removed');
    } catch {
      toast.error('Could not remove');
    } finally {
      setDeletingMedia(null);
    }
  };

  /* ─── Tab config ─────────────────────────────────────────────── */
  const TABS = [
    { key: 'profile',  label: '✏️ Edit Profile' },
    ...(user?.role === 'athlete' ? [
      { key: 'mediakit',  label: '📋 Media Kit' },
      { key: 'portfolio', label: '📸 Portfolio' },
    ] : []),
    { key: 'security', label: '🔒 Security' },
  ];

  return (
    <div className="profile-page fade-in">
      <div className="container">

        {/* ── Hero ────────────────────────────────────── */}
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            {user?.avatar
              ? <img src={user.avatar} alt="Avatar" className="avatar avatar-xl" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: '50%' }} />
              : <div className="avatar avatar-xl">{initials}</div>
            }
            <button className="avatar-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '📷'}
            </button>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-hero-name">{user?.name}</h1>
            <div className="profile-hero-badges">
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
              {user?.sport    && <span className="profile-tag">{user.sport}</span>}
              {user?.company  && <span className="profile-tag">{user.company}</span>}
              {user?.location && <span className="profile-tag">📍 {user.location}</span>}
            </div>
            {user?.bio && <p className="profile-bio">{user.bio}</p>}
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────── */}
        <div className="profile-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`profile-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════
            TAB: EDIT PROFILE
        ═══════════════════════════════════════════════ */}
        {tab === 'profile' && (
          <form onSubmit={handleSave} className="profile-form">

            {/* Basic Info */}
            <div className="profile-section">
              <h2 className="profile-section-title">Basic Info</h2>
              <div className="profile-grid">
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input name="name" className="form-input" value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location / City</label>
                  <input name="location" className="form-input" placeholder="Mumbai, India" value={form.location} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Bio</label>
                  <textarea name="bio" className="form-input" rows={3} placeholder="Tell your story..." value={form.bio} onChange={handleChange} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Athlete Details */}
            {user?.role === 'athlete' && (
              <>
                <div className="profile-section">
                  <h2 className="profile-section-title">Athlete Details</h2>
                  <div className="profile-grid">
                    <div className="form-group">
                      <label className="form-label">Sport</label>
                      <input name="sport" className="form-input" placeholder="e.g. Cricket" value={form.sport} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Achievements (comma separated)</label>
                      <input name="achievements" className="form-input" placeholder="Gold Medal 2023, National Champion..." value={form.achievements} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Instagram</label>
                      <input name="social_instagram" className="form-input" placeholder="@handle" value={form.socialLinks.instagram} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Twitter / X</label>
                      <input name="social_twitter" className="form-input" placeholder="@handle" value={form.socialLinks.twitter} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">YouTube</label>
                      <input name="social_youtube" className="form-input" placeholder="Channel URL" value={form.socialLinks.youtube} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h2 className="profile-section-title">Performance Stats</h2>
                  <p className="profile-section-sub">These stats appear on your public profile and help sponsors discover you.</p>
                  <div className="profile-grid">
                    <div className="form-group">
                      <label className="form-label">Engagement Rate (%)</label>
                      <input
                        name="engagementRate" type="number" min="0" max="100" step="0.1"
                        className="form-input" placeholder="e.g. 4.5"
                        value={form.engagementRate} onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monthly Views / Reach</label>
                      <input
                        name="monthlyViews" type="number" min="0"
                        className="form-input" placeholder="e.g. 120000"
                        value={form.monthlyViews} onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h2 className="profile-section-title">Asking Price</h2>
                  <p className="profile-section-sub">Set your expected sponsorship range per campaign so sponsors can filter by budget.</p>
                  <div className="profile-grid">
                    <div className="form-group">
                      <label className="form-label">Min Price</label>
                      <input name="askingPriceMin" type="number" min="0" className="form-input" placeholder="50000" value={form.askingPriceMin} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Price</label>
                      <input name="askingPriceMax" type="number" min="0" className="form-input" placeholder="200000" value={form.askingPriceMax} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Currency</label>
                      <select name="priceCurrency" className="form-input" value={form.priceCurrency} onChange={handleChange}>
                        <option>INR</option><option>USD</option><option>EUR</option><option>GBP</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Sponsor Details */}
            {user?.role === 'sponsor' && (
              <div className="profile-section">
                <h2 className="profile-section-title">Sponsor Details</h2>
                <div className="profile-grid">
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <input name="company" className="form-input" value={form.company} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <input name="industry" className="form-input" value={form.industry} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input name="website" className="form-input" placeholder="https://..." value={form.website} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sponsorship Budget Range</label>
                    <input name="sponsorshipBudget" className="form-input" placeholder="₹50k – ₹5L" value={form.sponsorshipBudget} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Sports of Interest (comma separated)</label>
                    <input name="interestedSports" className="form-input" placeholder="Cricket, Football, Tennis..." value={form.interestedSports} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            <div className="profile-form-footer">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><div className="spinner" />Saving...</> : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: MEDIA KIT (athletes only)
        ═══════════════════════════════════════════════ */}
        {tab === 'mediakit' && user?.role === 'athlete' && (
          <form onSubmit={handleMkSave} className="profile-form">

            <div className="profile-section">
              <h2 className="profile-section-title">Media Kit</h2>
              <p className="profile-section-sub">This is what sponsors see when they open your public profile.</p>
              <div className="profile-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label className="form-label">Headline</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Professional Sprinter | 4× National Champion | 120K Instagram"
                    value={mkForm.headline}
                    onChange={e => setMkForm(f => ({ ...f, headline: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Highlights (one per line)</label>
                  <textarea
                    className="form-input"
                    rows={6}
                    placeholder={"National Record Holder – 100m Sprint\n120K+ combined social media followers\n4.5% average engagement rate\nBrand ambassador for X, Y, Z\nAvailable for events, campaigns, appearances"}
                    value={mkForm.highlights}
                    onChange={e => setMkForm(f => ({ ...f, highlights: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="profile-grid">
                  <div className="form-group">
                    <label className="form-label">Pricing Info</label>
                    <input
                      className="form-input"
                      placeholder="e.g. ₹50k–₹2L per campaign"
                      value={mkForm.pricing}
                      onChange={e => setMkForm(f => ({ ...f, pricing: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Availability</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Available from Jan 2026, Max 2 deals/month"
                      value={mkForm.availability}
                      onChange={e => setMkForm(f => ({ ...f, availability: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Sponsors */}
            <div className="profile-section">
              <h2 className="profile-section-title">Previous Sponsors</h2>
              <p className="profile-section-sub">Add brands you've worked with before joining the platform.</p>

              {prevSponsors.length > 0 && (
                <div className="prev-sponsors-list">
                  {prevSponsors.map((sp, i) => (
                    <div key={i} className="prev-sponsor-item">
                      <div className="psb-brand">{sp.brandName}</div>
                      {sp.year && <div className="psb-year">{sp.year}</div>}
                      {sp.description && <div className="psb-desc">{sp.description}</div>}
                      <button type="button" className="psb-remove" onClick={() => handleRemoveBrand(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {addingBrand ? (
                <div className="add-brand-form card">
                  <div className="profile-grid">
                    <div className="form-group">
                      <label className="form-label">Brand Name *</label>
                      <input className="form-input" placeholder="Nike, Adidas..." value={newSponsor.brandName}
                        onChange={e => setNewSponsor(n => ({ ...n, brandName: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Year</label>
                      <input className="form-input" placeholder="2023" value={newSponsor.year}
                        onChange={e => setNewSponsor(n => ({ ...n, year: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Description</label>
                      <input className="form-input" placeholder="Brand Ambassador, Event Sponsorship..." value={newSponsor.description}
                        onChange={e => setNewSponsor(n => ({ ...n, description: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleAddBrand}>Add</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingBrand(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddingBrand(true)}>
                  + Add Brand
                </button>
              )}
            </div>

            <div className="profile-form-footer">
              <button type="submit" className="btn btn-primary" disabled={mkSaving}>
                {mkSaving ? <><div className="spinner" />Saving...</> : 'Save Media Kit'}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: PORTFOLIO (athletes only)
        ═══════════════════════════════════════════════ */}
        {tab === 'portfolio' && user?.role === 'athlete' && (
          <div className="profile-form">
            <div className="profile-section">
              <div className="portfolio-header">
                <div>
                  <h2 className="profile-section-title">Portfolio</h2>
                  <p className="profile-section-sub">Upload photos and videos that showcase your work. Max 12 items, 10MB each.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploadingMedia || portfolio.length >= 12}
                >
                  {uploadingMedia
                    ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Uploading...</>
                    : '+ Upload Media'}
                </button>
                <input
                  type="file"
                  ref={mediaInputRef}
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {portfolio.length === 0 ? (
                <div className="portfolio-empty" onClick={() => mediaInputRef.current?.click()}>
                  <span className="portfolio-empty-icon">📸</span>
                  <p>Click to upload your first photo or video</p>
                  <p className="portfolio-empty-sub">Sponsors will see these on your profile</p>
                </div>
              ) : (
                <div className="portfolio-grid">
                  {portfolio.map((m) => (
                    <div key={m._id} className="portfolio-item">
                      {m.mediaType === 'video'
                        ? <video src={m.url} className="portfolio-asset" />
                        : <img src={m.url} alt={m.caption || 'Portfolio'} className="portfolio-asset" />
                      }
                      <button
                        className="portfolio-delete"
                        onClick={() => handleDeleteMedia(m._id)}
                        disabled={deletingMedia === m._id}
                        title="Remove"
                      >
                        {deletingMedia === m._id
                          ? <span className="spinner" style={{ width: 12, height: 12 }} />
                          : '✕'}
                      </button>
                      {m.mediaType === 'video' && <span className="portfolio-video-badge">▶</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: SECURITY
        ═══════════════════════════════════════════════ */}
        {tab === 'security' && (
          <form onSubmit={handlePasswordChange} className="profile-form">
            <div className="profile-section">
              <h2 className="profile-section-title">Change Password</h2>
              <div className="profile-grid" style={{ maxWidth: 480 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Current password</label>
                  <input type="password" className="form-input" value={pwForm.currentPassword}
                    onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">New password</label>
                  <input type="password" className="form-input" placeholder="Min 6 characters" value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Confirm new password</label>
                  <input type="password" className="form-input" value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
                </div>
              </div>
            </div>
            <div className="profile-form-footer">
              <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                {pwSaving ? <><div className="spinner" />Updating...</> : 'Update Password'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Profile;
