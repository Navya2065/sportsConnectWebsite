import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './ContractModal.css';

/* ─── Template options ───────────────────────────────────────────────── */
const TEMPLATES = [
  {
    key:   'brand_ambassador',
    label: 'Brand Ambassador',
    icon:  '🏅',
    desc:  'Long-term brand representation, appearances, general endorsement',
  },
  {
    key:   'social_media',
    label: 'Social Media Campaign',
    icon:  '📱',
    desc:  'Specific posts, stories, videos, content creation campaign',
  },
  {
    key:   'event_appearance',
    label: 'Event Appearance',
    icon:  '🎪',
    desc:  'One-time or recurring physical event appearances',
  },
];

/* ─── Status badge ───────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    draft:           { label: 'Draft',           color: 'muted'   },
    pending_athlete: { label: 'Awaiting Athlete Signature', color: 'yellow'  },
    fully_signed:    { label: '✓ Fully Signed',  color: 'green'   },
    voided:          { label: 'Voided',           color: 'red'     },
  };
  const { label, color } = map[status] || { label: status, color: 'muted' };
  return <span className={`contract-badge contract-badge--${color}`}>{label}</span>;
};

/* ─── ContractModal ──────────────────────────────────────────────────── */
const ContractModal = ({ sponsorship, userRole, userId, onClose }) => {
  const [contract, setContract]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [step, setStep]             = useState('loading'); // loading | generate | view | sign
  const [submitting, setSubmitting] = useState(false);

  // Generate form
  const [templateType, setTemplateType] = useState('brand_ambassador');
  const [customTerms,  setCustomTerms]  = useState('');

  // Sign form
  const [signName, setSignName] = useState('');

  // ── Load existing contract on open ──
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/contracts/sponsorship/${sponsorship._id}`);
        setContract(data.contract);
        setStep('view');
      } catch (err) {
        if (err.response?.status === 404) {
          setStep(userRole === 'sponsor' ? 'generate' : 'no_contract');
        } else {
          toast.error('Failed to load contract');
          onClose();
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sponsorship._id, userRole, onClose]);

  // ── Generate contract (sponsor) ──
  const handleGenerate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/contracts', {
        sponsorshipId: sponsorship._id,
        templateType,
        customTerms,
      });
      setContract(data.contract);
      setStep('view');
      toast.success('Contract generated & sent to athlete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate contract');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Sign contract (athlete) ──
  const handleSign = async (e) => {
    e.preventDefault();
    if (!signName.trim()) return toast.error('Please enter your full name as signature');
    setSubmitting(true);
    try {
      const { data } = await api.put(`/contracts/${contract._id}/sign`, {
        signatureName: signName.trim(),
      });
      setContract(data.contract);
      setStep('view');
      toast.success('Contract signed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sign contract');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Void contract (sponsor) ──
  const handleVoid = async () => {
    if (!window.confirm('Are you sure you want to void this contract? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      const { data } = await api.put(`/contracts/${contract._id}/void`);
      setContract(data.contract);
      toast.success('Contract voided');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to void contract');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Download / Print PDF ──
  const handleDownload = () => {
    // Open the server-rendered HTML in a new tab, then trigger browser print
    const token = localStorage.getItem('token');
    const url   = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/contracts/${contract._id}/html?token=${token}`;
    const win   = window.open(url, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        setTimeout(() => win.print(), 500);
      });
    }
  };

  /* ─────────────── Render ──────────────────────────────────────────── */

  const other = userRole === 'athlete' ? sponsorship.sponsor : sponsorship.athlete;

  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-box card" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="cm-header">
          <div className="cm-header-left">
            <div className="cm-icon">📄</div>
            <div>
              <div className="cm-title">
                {contract ? `Contract ${contract.contractNumber}` : 'Sponsorship Contract'}
              </div>
              <div className="cm-sub">
                {sponsorship.deal?.title || 'Deal Agreement'} · with {other?.name || other?.company}
              </div>
            </div>
          </div>
          <div className="cm-header-right">
            {contract && <StatusBadge status={contract.status} />}
            <button className="cm-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="cm-body cm-center">
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        )}

        {/* ── NO CONTRACT (athlete view, nothing generated yet) ── */}
        {!loading && step === 'no_contract' && (
          <div className="cm-body cm-center">
            <div className="cm-empty-icon">📋</div>
            <p className="cm-empty-title">No contract yet</p>
            <p className="cm-empty-sub">The sponsor hasn't generated a contract for this deal yet.</p>
          </div>
        )}

        {/* ── GENERATE FORM (sponsor) ── */}
        {!loading && step === 'generate' && (
          <form onSubmit={handleGenerate} className="cm-body">
            <p className="cm-section-label">Choose Contract Template</p>
            <div className="cm-templates">
              {TEMPLATES.map((t) => (
                <div
                  key={t.key}
                  className={`cm-template ${templateType === t.key ? 'cm-template--active' : ''}`}
                  onClick={() => setTemplateType(t.key)}
                >
                  <span className="cm-template-icon">{t.icon}</span>
                  <div>
                    <div className="cm-template-name">{t.label}</div>
                    <div className="cm-template-desc">{t.desc}</div>
                  </div>
                  <div className="cm-template-check">{templateType === t.key ? '✓' : ''}</div>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Additional Terms (optional)</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Add any specific clauses, deliverables, or conditions not covered by the template..."
                value={customTerms}
                onChange={(e) => setCustomTerms(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="cm-info-box">
              <span>ℹ️</span>
              <span>You will automatically sign the contract as the sponsor. The athlete will then receive a notification to review and sign.</span>
            </div>

            <div className="cm-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting
                  ? <span className="spinner" style={{ width: 16, height: 16 }} />
                  : '📄 Generate & Send Contract'}
              </button>
            </div>
          </form>
        )}

        {/* ── CONTRACT VIEW ── */}
        {!loading && step === 'view' && contract && (
          <div className="cm-body">

            {/* Signature Status */}
            <div className="cm-sig-status">
              <div className={`cm-sig-party ${contract.sponsorSignature?.name ? 'signed' : 'pending'}`}>
                <span className="cm-sig-check">{contract.sponsorSignature?.name ? '✓' : '○'}</span>
                <div>
                  <div className="cm-sig-role">Sponsor</div>
                  <div className="cm-sig-name">
                    {contract.sponsorSignature?.name || 'Not signed yet'}
                  </div>
                  {contract.sponsorSignature?.signedAt && (
                    <div className="cm-sig-date">
                      {new Date(contract.sponsorSignature.signedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="cm-sig-arrow">→</div>

              <div className={`cm-sig-party ${contract.athleteSignature?.name ? 'signed' : 'pending'}`}>
                <span className="cm-sig-check">{contract.athleteSignature?.name ? '✓' : '○'}</span>
                <div>
                  <div className="cm-sig-role">Athlete</div>
                  <div className="cm-sig-name">
                    {contract.athleteSignature?.name || 'Not signed yet'}
                  </div>
                  {contract.athleteSignature?.signedAt && (
                    <div className="cm-sig-date">
                      {new Date(contract.athleteSignature.signedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contract preview iframe — token passed as query param */}
            <div className="cm-preview-wrap">
              <iframe
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/contracts/${contract._id}/html?token=${localStorage.getItem('token')}`}
                className="cm-preview-frame"
                title="Contract Preview"
              />
            </div>

            {/* Actions */}
            <div className="cm-actions cm-actions--view">
              {/* Athlete sign button */}
              {userRole === 'athlete' && contract.status === 'pending_athlete' && (
                <button
                  className="btn btn-primary"
                  onClick={() => setStep('sign')}
                >
                  ✍️ Sign Contract
                </button>
              )}

              {/* Download PDF */}
              {(contract.status === 'fully_signed' || contract.sponsorSignature?.name) && (
                <button className="btn btn-secondary" onClick={handleDownload}>
                  ⬇️ Download PDF
                </button>
              )}

              {/* Sponsor void */}
              {userRole === 'sponsor' && contract.status === 'pending_athlete' && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleVoid}
                  disabled={submitting}
                  style={{ marginLeft: 'auto', color: 'var(--red)' }}
                >
                  Void Contract
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── SIGN FORM (athlete) ── */}
        {!loading && step === 'sign' && contract && (
          <form onSubmit={handleSign} className="cm-body">
            <div className="cm-sign-header">
              <div className="cm-sign-icon">✍️</div>
              <div className="cm-sign-title">Sign the Contract</div>
              <div className="cm-sign-sub">
                By signing below, you agree to all terms and conditions in Contract {contract.contractNumber}.
              </div>
            </div>

            {/* Summary of what they're signing */}
            <div className="cm-sign-summary">
              <div className="cm-sign-row">
                <span>Deal</span>
                <span>{sponsorship.deal?.title || 'Sponsorship Agreement'}</span>
              </div>
              <div className="cm-sign-row">
                <span>Sponsor</span>
                <span>{sponsorship.sponsor?.company || sponsorship.sponsor?.name}</span>
              </div>
              {sponsorship.deal?.value > 0 && (
                <div className="cm-sign-row">
                  <span>Value</span>
                  <span>{sponsorship.deal.currency} {sponsorship.deal.value.toLocaleString()}</span>
                </div>
              )}
              <div className="cm-sign-row">
                <span>Template</span>
                <span>{TEMPLATES.find(t => t.key === contract.templateType)?.label}</span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Type your full legal name to sign *</label>
              <input
                className="form-input cm-sig-input"
                placeholder="Your full name"
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                required
                autoFocus
              />
              <span className="form-hint">This acts as your electronic signature</span>
            </div>

            <div className="cm-sign-legal">
              By clicking "Sign Contract" you confirm that you have read, understood, and agree to be
              legally bound by the terms of this Agreement. Your typed name above constitutes your
              legally valid electronic signature.
            </div>

            <div className="cm-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep('view')} disabled={submitting}>
                ← Back to Contract
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !signName.trim()}>
                {submitting
                  ? <span className="spinner" style={{ width: 16, height: 16 }} />
                  : '✍️ Sign Contract'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ContractModal;
