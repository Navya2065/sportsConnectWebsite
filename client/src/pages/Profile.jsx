import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Shared/Navbar';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    sport: user?.sport || '',
    company: user?.company || '',
    industry: user?.industry || '',
    website: user?.website || '',
    sponsorshipBudget: user?.sponsorshipBudget || '',
    socialLinks: {
      instagram: user?.socialLinks?.instagram || '',
      twitter: user?.socialLinks?.twitter || '',
      youtube: user?.socialLinks?.youtube || '',
    },
    interestedSports: user?.interestedSports?.join(', ') || '',
    achievements: user?.achievements?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('profile');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const fileInputRef = useRef(null);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
        achievements: form.achievements.split(',').map(s => s.trim()).filter(Boolean),
      };
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
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <>
     
      <div className="profile-page fade-in">
        <div className="container">
          <div className="profile-hero">
            <div className="profile-avatar-wrap">
              {user?.avatar
                ? <img src={user.avatar} alt="Avatar" className="avatar avatar-xl" style={{ width: 96, height: 96 }} />
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
                {user?.sport && <span className="profile-tag">{user.sport}</span>}
                {user?.company && <span className="profile-tag">{user.company}</span>}
                {user?.location && <span className="profile-tag">📍 {user.location}</span>}
              </div>
              {user?.bio && <p className="profile-bio">{user.bio}</p>}
            </div>
          </div>

          <div className="profile-tabs">
            {['profile', 'security'].map(t => (
              <button key={t} className={`profile-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'profile' ? '✏️ Edit Profile' : '🔒 Security'}
              </button>
            ))}
          </div>

          {tab === 'profile' && (
            <form onSubmit={handleSave} className="profile-form">
              <div className="profile-section">
                <h2 className="profile-section-title">Basic info</h2>
                <div className="profile-grid">
                  <div className="form-group">
                    <label className="form-label">Full name</label>
                    <input name="name" className="form-input" value={form.name} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input name="location" className="form-input" placeholder="City, Country" value={form.location} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Bio</label>
                    <textarea name="bio" className="form-input" rows={3} placeholder="Tell your story..." value={form.bio} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {user?.role === 'athlete' && (
                <div className="profile-section">
                  <h2 className="profile-section-title">Athlete details</h2>
                  <div className="profile-grid">
                    <div className="form-group">
                      <label className="form-label">Sport</label>
                      <input name="sport" className="form-input" placeholder="e.g. Football" value={form.sport} onChange={handleChange} />
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
              )}

              {user?.role === 'sponsor' && (
                <div className="profile-section">
                  <h2 className="profile-section-title">Sponsor details</h2>
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
                      <label className="form-label">Sponsorship budget range</label>
                      <input name="sponsorshipBudget" className="form-input" placeholder="e.g. $5,000 – $20,000" value={form.sponsorshipBudget} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Sports of interest (comma separated)</label>
                      <input name="interestedSports" className="form-input" placeholder="Football, Swimming, Tennis..." value={form.interestedSports} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}

              <div className="profile-form-footer">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><div className="spinner" />Saving...</> : 'Save changes'}
                </button>
              </div>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={handlePasswordChange} className="profile-form">
              <div className="profile-section">
                <h2 className="profile-section-title">Change password</h2>
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
                  {pwSaving ? <><div className="spinner" />Updating...</> : 'Update password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
