import { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './ApplyCampaignModal.css';

const ApplyCampaignModal = ({ campaign, onClose, onApplied }) => {
  const [pitch, setPitch]           = useState('');
  const [askingRate, setAskingRate] = useState('');
  const [saving, setSaving]         = useState(false);

  const fmt = (n, cur = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/campaigns/${campaign._id}/apply`, { pitch, askingRate: Number(askingRate) || 0 });
      toast.success('Application sent! 🎉');
      onApplied?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally { setSaving(false); }
  };

  const perSlot = campaign.slots > 1
    ? `≈ ${fmt(campaign.budget / campaign.slots, campaign.currency)} per athlete`
    : null;

  return (
    <div className="acm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="acm-box">
        <div className="acm-header">
          <div className="acm-header-left">
            <span className="acm-icon">📝</span>
            <div>
              <div className="acm-title">Apply for Campaign</div>
              <div className="acm-sub">{campaign.title}</div>
            </div>
          </div>
          <button className="acm-close" onClick={onClose}>✕</button>
        </div>

        {/* Campaign snapshot */}
        <div className="acm-snapshot">
          <div className="acm-snap-item">
            <span className="acm-snap-icon">💰</span>
            <div>
              <div className="acm-snap-val">{fmt(campaign.budget, campaign.currency)}</div>
              {perSlot && <div className="acm-snap-sub">{perSlot}</div>}
            </div>
          </div>
          <div className="acm-snap-item">
            <span className="acm-snap-icon">👥</span>
            <div>
              <div className="acm-snap-val">{campaign.slotsLeft ?? (campaign.slots - campaign.filledSlots)} slots left</div>
              <div className="acm-snap-sub">of {campaign.slots} total</div>
            </div>
          </div>
          {campaign.sport && (
            <div className="acm-snap-item">
              <span className="acm-snap-icon">🏅</span>
              <div><div className="acm-snap-val">{campaign.sport}</div></div>
            </div>
          )}
        </div>

        {campaign.deliverables && (
          <div className="acm-deliverables">
            <div className="acm-dlabel">📋 Deliverables</div>
            <p className="acm-dtext">{campaign.deliverables}</p>
          </div>
        )}

        <form className="acm-body" onSubmit={handleSubmit}>
          <div className="acm-field">
            <label className="acm-label">Your Pitch</label>
            <textarea className="input acm-textarea"
              placeholder="Why are you the right athlete for this campaign? Highlight your reach, past work, engagement..."
              value={pitch} onChange={e => setPitch(e.target.value)}
              rows={4} maxLength={800} />
            <p className="acm-char">{pitch.length}/800</p>
          </div>

          <div className="acm-field">
            <label className="acm-label">Your Asking Rate <span className="acm-opt">(optional)</span></label>
            <div className="acm-rate-wrap">
              <span className="acm-currency">{campaign.currency}</span>
              <input className="input acm-rate-input" type="number" min={0}
                placeholder="0"
                value={askingRate} onChange={e => setAskingRate(e.target.value)} />
            </div>
            <p className="acm-hint">Leave blank to go with the campaign rate</p>
          </div>

          <div className="acm-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Sending…' : '🚀 Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyCampaignModal;
