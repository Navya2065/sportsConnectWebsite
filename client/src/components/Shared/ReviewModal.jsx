import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './ReviewModal.css';

/* ─── Highlight tag options per role ────────────────────────────────────── */
const HIGHLIGHT_OPTIONS = {
  athlete: [
    'Professional',
    'Reliable',
    'On-time Delivery',
    'Creative',
    'High Engagement',
    'Good Communication',
    'Authentic',
  ],
  sponsor: [
    'Fast Payment',
    'Clear Brief',
    'Respectful',
    'Fair Terms',
    'Paid On Time',
    'Good Communication',
    'Organised',
  ],
};

/* ─── Star component ─────────────────────────────────────────────────────── */
const StarRow = ({ value, hovered, onHover, onLeave, onClick, readonly }) => (
  <div className="rm-stars" onMouseLeave={onLeave}>
    {[1, 2, 3, 4, 5].map((star) => {
      const active = star <= (readonly ? value : hovered || value);
      return (
        <span
          key={star}
          className={`rm-star ${active ? 'rm-star--active' : ''} ${readonly ? 'rm-star--readonly' : ''}`}
          onMouseEnter={() => !readonly && onHover(star)}
          onClick={() => !readonly && onClick(star)}
        >
          ★
        </span>
      );
    })}
  </div>
);

/* ─── ReviewModal ────────────────────────────────────────────────────────── */
const ReviewModal = ({ sponsorship, userRole, onClose, onReviewSubmitted }) => {
  // The person being reviewed is the OTHER party
  const reviewee     = userRole === 'sponsor' ? sponsorship.athlete : sponsorship.sponsor;
  const revieweeName = reviewee?.name || reviewee?.company || 'them';

  // Which highlight tags apply (tags describe the reviewee, chosen by the reviewer)
  // Athlete reviewing sponsor → use sponsor tags; Sponsor reviewing athlete → use athlete tags
  const highlightPool = userRole === 'sponsor'
    ? HIGHLIGHT_OPTIONS.athlete
    : HIGHLIGHT_OPTIONS.sponsor;

  const [existing,    setExisting]    = useState(null);  // already submitted review
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);

  // Form state
  const [rating,      setRating]      = useState(0);
  const [hovered,     setHovered]     = useState(0);
  const [highlights,  setHighlights]  = useState([]);
  const [reviewText,  setReviewText]  = useState('');

  // ── Check for existing review on open ──
  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await api.get(`/reviews/check/${sponsorship._id}`);
        if (data.hasReviewed) setExisting(data.review);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [sponsorship._id]);

  const toggleHighlight = (tag) => {
    setHighlights((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a star rating');
    setSubmitting(true);
    try {
      const { data } = await api.post('/reviews', {
        sponsorshipId: sponsorship._id,
        rating,
        review: reviewText.trim(),
        highlights,
      });
      toast.success('Review submitted!');
      setExisting(data.review);
      onReviewSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-box card" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="rm-header">
          <div className="rm-header-left">
            <div className="rm-icon">⭐</div>
            <div>
              <div className="rm-title">
                {existing ? 'Your Review' : `Review ${revieweeName}`}
              </div>
              <div className="rm-sub">
                {sponsorship.deal?.title || 'Completed Deal'}
              </div>
            </div>
          </div>
          <button className="rm-close" onClick={onClose}>✕</button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rm-body rm-center">
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        )}

        {/* ── Already reviewed — read-only view ── */}
        {!loading && existing && (
          <div className="rm-body">
            <div className="rm-already-badge">✓ You've already reviewed this deal</div>

            <div className="rm-view-section">
              <p className="rm-section-label">Your Rating</p>
              <StarRow value={existing.rating} readonly />
              <p className="rm-rating-label">{existing.rating} / 5</p>
            </div>

            {existing.highlights?.length > 0 && (
              <div className="rm-view-section">
                <p className="rm-section-label">Highlights</p>
                <div className="rm-chips">
                  {existing.highlights.map((h) => (
                    <span key={h} className="rm-chip rm-chip--selected">{h}</span>
                  ))}
                </div>
              </div>
            )}

            {existing.review && (
              <div className="rm-view-section">
                <p className="rm-section-label">Your Written Review</p>
                <p className="rm-review-text">"{existing.review}"</p>
              </div>
            )}

            <div className="rm-actions">
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {/* ── New review form ── */}
        {!loading && !existing && (
          <form onSubmit={handleSubmit} className="rm-body">

            {/* Star picker */}
            <div className="rm-form-section">
              <p className="rm-section-label">Overall Rating *</p>
              <StarRow
                value={rating}
                hovered={hovered}
                onHover={setHovered}
                onLeave={() => setHovered(0)}
                onClick={setRating}
              />
              <p className="rm-rating-hint">
                {rating === 0 && 'Click a star to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Highlight tags */}
            <div className="rm-form-section">
              <p className="rm-section-label">Highlights <span className="rm-optional">(optional)</span></p>
              <div className="rm-chips">
                {highlightPool.map((tag) => (
                  <span
                    key={tag}
                    className={`rm-chip ${highlights.includes(tag) ? 'rm-chip--selected' : ''}`}
                    onClick={() => toggleHighlight(tag)}
                  >
                    {highlights.includes(tag) ? '✓ ' : ''}{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Written review */}
            <div className="rm-form-section">
              <p className="rm-section-label">Written Review <span className="rm-optional">(optional)</span></p>
              <textarea
                className="form-input rm-textarea"
                rows={4}
                maxLength={600}
                placeholder={`Share your experience working with ${revieweeName}…`}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
              <p className="rm-char-count">{reviewText.length} / 600</p>
            </div>

            <div className="rm-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || rating === 0}>
                {submitting
                  ? <span className="spinner" style={{ width: 16, height: 16 }} />
                  : '⭐ Submit Review'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ReviewModal;
