import { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './CreateCampaignModal.css';

const SPORTS = ['Cricket','Football','Basketball','Tennis','Athletics','Swimming',
  'Badminton','Hockey','Kabaddi','Wrestling','Boxing','Cycling','Other'];

const CURRENCIES = ['INR','USD','EUR','GBP'];

const CreateCampaignModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '', description: '', sport: '', budget: '',
    currency: 'INR', slots: '1', startDate: '', endDate: '', deliverables: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.budget || isNaN(form.budget)) return toast.error('Enter a valid budget');
    setSaving(true);
    try {
      const { data } = await api.post('/campaigns', form);
      toast.success('Campaign created!');
      onCreated?.(data.campaign);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    } finally { setSaving(false); }
  };

  return (
    <div className="ccm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ccm-box">
        {/* Header */}
        <div className="ccm-header">
          <div className="ccm-header-left">
            <span className="ccm-icon">📣</span>
            <div>
              <div className="ccm-title">Create Campaign</div>
              <div className="ccm-sub">Find the right athletes for your brand</div>
            </div>
          </div>
          <button className="ccm-close" onClick={onClose}>✕</button>
        </div>

        <form className="ccm-body" onSubmit={handleSubmit}>

          {/* Title */}
          <div className="ccm-field">
            <label className="ccm-label">Campaign Title <span className="ccm-req">*</span></label>
            <input className="input" placeholder="e.g. Need 5 runners for Delhi Marathon Promo"
              value={form.title} onChange={e => set('title', e.target.value)} maxLength={120} />
          </div>

          {/* Description */}
          <div className="ccm-field">
            <label className="ccm-label">Description</label>
            <textarea className="input ccm-textarea"
              placeholder="Tell athletes what this campaign is about, what your brand does, the vibe..."
              value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>

          {/* Deliverables */}
          <div className="ccm-field">
            <label className="ccm-label">Deliverables / Requirements</label>
            <textarea className="input ccm-textarea"
              placeholder="e.g. 3 Instagram posts, 1 reel, attend event on 15 Jan, wear kit during match"
              value={form.deliverables} onChange={e => set('deliverables', e.target.value)} rows={2} />
          </div>

          {/* Sport + Slots */}
          <div className="ccm-row">
            <div className="ccm-field">
              <label className="ccm-label">Sport / Category</label>
              <select className="input" value={form.sport} onChange={e => set('sport', e.target.value)}>
                <option value="">All sports</option>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="ccm-field ccm-field--sm">
              <label className="ccm-label">Athletes needed</label>
              <input className="input" type="number" min={1} max={100}
                value={form.slots} onChange={e => set('slots', e.target.value)} />
            </div>
          </div>

          {/* Budget */}
          <div className="ccm-row">
            <div className="ccm-field ccm-field--sm">
              <label className="ccm-label">Currency</label>
              <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="ccm-field">
              <label className="ccm-label">Total Budget <span className="ccm-req">*</span></label>
              <input className="input" type="number" min={0}
                placeholder="e.g. 100000"
                value={form.budget} onChange={e => set('budget', e.target.value)} />
            </div>
          </div>

          {/* Dates */}
          <div className="ccm-row">
            <div className="ccm-field">
              <label className="ccm-label">Start Date</label>
              <input className="input" type="date" value={form.startDate}
                onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="ccm-field">
              <label className="ccm-label">End Date</label>
              <input className="input" type="date" value={form.endDate}
                onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          {/* Footer */}
          <div className="ccm-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : '🚀 Launch Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignModal;
