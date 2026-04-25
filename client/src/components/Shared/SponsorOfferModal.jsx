import { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './SponsorOfferModal.css';

/**
 * SponsorOfferModal
 * Props:
 *   athlete   — { _id, name } object
 *   onClose   — callback to close modal
 *   onSuccess — optional callback after successful submission
 */
const SponsorOfferModal = ({ athlete, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    value: '',
    currency: 'INR',
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Deal title is required');
    setLoading(true);
    try {
      await api.post('/sponsorships', {
        athleteId: athlete._id,
        deal: {
          title:       form.title.trim(),
          description: form.description.trim(),
          value:       parseFloat(form.value) || 0,
          currency:    form.currency,
          startDate:   form.startDate || undefined,
          endDate:     form.endDate || undefined,
        },
        notes: form.notes.trim(),
      });
      toast.success(`Offer sent to ${athlete.name}!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  const initials = athlete?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="som-overlay" onClick={onClose}>
      <div className="som-box card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="som-header">
          <div className="som-athlete-info">
            <div className="avatar avatar-md">{initials}</div>
            <div>
              <div className="som-title">Send Sponsorship Offer</div>
              <div className="som-sub">to {athlete?.name}</div>
            </div>
          </div>
          <button className="som-close" onClick={onClose}>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="som-form">
          <div className="form-group">
            <label className="form-label">Deal Title *</label>
            <input
              className="form-input"
              placeholder="e.g. Brand Ambassador 2025"
              value={form.title}
              onChange={set('title')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Deliverables, expectations, requirements..."
              value={form.description}
              onChange={set('description')}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="som-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Deal Value</label>
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="0"
                value={form.value}
                onChange={set('value')}
              />
            </div>
            <div className="form-group" style={{ width: 100 }}>
              <label className="form-label">Currency</label>
              <select className="form-input" value={form.currency} onChange={set('currency')}>
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>AUD</option>
              </select>
            </div>
          </div>

          <div className="som-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={form.startDate} onChange={set('startDate')} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={form.endDate} onChange={set('endDate')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Personal Note</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Add a message to the athlete..."
              value={form.notes}
              onChange={set('notes')}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="som-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <span className="spinner" style={{ width: 16, height: 16 }} />
                : '🤝 Send Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SponsorOfferModal;
