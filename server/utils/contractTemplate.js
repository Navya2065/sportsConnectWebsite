/**
 * contractTemplate.js
 * Generates a print-ready HTML contract document.
 * Returned string is sent to the client, opened in a new window, and printed as PDF.
 */

// ─── Template clause sets ──────────────────────────────────────────────────
const TEMPLATE_CLAUSES = {
  brand_ambassador: {
    title:  'Brand Ambassador Agreement',
    scope:  'The Athlete agrees to serve as a Brand Ambassador for the Sponsor, representing the brand in a positive and professional manner across all platforms and appearances.',
    obligations: [
      'Prominently display or wear Sponsor\'s branded merchandise during training sessions, competitions, and public appearances.',
      'Mention and promote the Sponsor\'s brand on personal social media channels as agreed.',
      'Attend a minimum of two (2) brand events or activations per quarter, subject to the Athlete\'s competition schedule.',
      'Provide advance notice of at least seven (7) days for any public appearance obligations.',
      'Maintain a professional public image consistent with the Sponsor\'s brand values.',
    ],
    rights: [
      'Sponsor has the right to use the Athlete\'s name, likeness, image, and testimonials for marketing and promotional purposes during the contract term.',
      'All creative content featuring the Athlete must be approved by the Athlete before publication.',
    ],
    exclusivity: 'The Athlete agrees not to enter into endorsement agreements with direct competitors of the Sponsor in the same product category during the contract term.',
  },

  social_media: {
    title:  'Social Media Campaign Agreement',
    scope:  'The Athlete agrees to create and publish sponsored content on their social media channels to promote the Sponsor\'s brand, products, or services as specified herein.',
    obligations: [
      'Create and publish the agreed number of sponsored posts, stories, and/or videos as outlined in the Deal Details section.',
      'All content must include the required brand hashtags, tags, and disclosure language (e.g., #Ad or #Sponsored) as required by applicable law.',
      'Submit all content drafts to the Sponsor for approval at least forty-eight (48) hours before the intended publication date.',
      'Maintain published content live for a minimum of thirty (30) days from the date of posting.',
      'Provide performance analytics (reach, impressions, engagement) within seven (7) days of posting.',
    ],
    rights: [
      'Sponsor has the right to repurpose and re-share all sponsored content created under this Agreement on their own platforms.',
      'The Athlete retains ownership of their accounts and all original content.',
    ],
    exclusivity: 'During the active campaign period, the Athlete agrees not to promote competing brands in the same product category on their social media channels.',
  },

  event_appearance: {
    title:  'Event Appearance Agreement',
    scope:  'The Athlete agrees to make one or more personal appearances at events organised or designated by the Sponsor, as described in the Deal Details section.',
    obligations: [
      'Appear at the designated event(s) on the agreed date(s) and time(s), in a professional and presentable manner.',
      'Participate in meet-and-greet sessions, autograph signings, photo opportunities, and brief media interactions as reasonably requested.',
      'Wear Sponsor-branded attire during the appearance unless mutually agreed otherwise.',
      'Provide at least fourteen (14) days\' advance notice if the Athlete is unable to fulfil an appearance due to injury, illness, or force majeure.',
      'Refrain from making any public statements that could damage the Sponsor\'s brand reputation during the event.',
    ],
    rights: [
      'Sponsor has the right to photograph and record the Athlete\'s appearance and use such material for promotional purposes.',
      'Travel, accommodation, and reasonable expenses for the event will be arranged and paid by the Sponsor unless otherwise agreed.',
    ],
    exclusivity: 'The Athlete agrees not to participate in any competing brand\'s events on the same day as a scheduled Sponsor event without prior written consent.',
  },
};

// ─── Main HTML generator ───────────────────────────────────────────────────
const generateContractHTML = (contract, sponsorship) => {
  const clauses = TEMPLATE_CLAUSES[contract.templateType] || TEMPLATE_CLAUSES.brand_ambassador;

  const athlete = sponsorship.athlete;
  const sponsor = sponsorship.sponsor;
  const deal    = sponsorship.deal || {};

  const fmt       = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not specified';
  const fmtMoney  = (v, c) => v > 0 ? `${c || 'INR'} ${Number(v).toLocaleString('en-IN')}` : 'As mutually agreed';
  const today     = fmt(new Date());

  const sponsorSig  = contract.sponsorSignature;
  const athleteSig  = contract.athleteSignature;
  const isSigned    = contract.status === 'fully_signed';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${clauses.title} — ${contract.contractNumber}</title>
  <style>
    /* ── Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', serif;
      font-size: 12pt;
      color: #1a1a2e;
      background: #fff;
      padding: 0;
    }

    /* ── Page wrapper ── */
    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 64px;
    }

    /* ── Header ── */
    .contract-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 3px solid #4c1d95;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .brand-name {
      font-family: 'Arial', sans-serif;
      font-size: 22pt;
      font-weight: 700;
      color: #4c1d95;
      letter-spacing: 0.06em;
    }
    .brand-sub { font-size: 9pt; color: #6d28d9; margin-top: 2px; font-family: Arial, sans-serif; }
    .contract-meta { text-align: right; font-size: 9pt; color: #555; font-family: Arial, sans-serif; }
    .contract-meta strong { color: #1a1a2e; }

    /* ── Title ── */
    .contract-title {
      text-align: center;
      font-size: 18pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #1a1a2e;
      margin-bottom: 8px;
    }
    .contract-subtitle {
      text-align: center;
      font-size: 10pt;
      color: #555;
      margin-bottom: 28px;
      font-family: Arial, sans-serif;
    }

    /* ── Parties ── */
    .parties-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .parties-table td {
      width: 50%;
      padding: 16px 20px;
      vertical-align: top;
      border: 1px solid #d4b8ff;
      background: #faf5ff;
    }
    .party-role {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6d28d9;
      margin-bottom: 6px;
      font-family: Arial, sans-serif;
    }
    .party-name { font-size: 13pt; font-weight: 700; color: #1a1a2e; }
    .party-detail { font-size: 10pt; color: #555; margin-top: 3px; font-family: Arial, sans-serif; }

    /* ── Sections ── */
    .section { margin-bottom: 22px; }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #4c1d95;
      border-bottom: 1px solid #e9d5ff;
      padding-bottom: 5px;
      margin-bottom: 10px;
      font-family: Arial, sans-serif;
    }
    p { line-height: 1.65; margin-bottom: 8px; font-size: 11pt; }
    ol, ul { padding-left: 20px; }
    li { line-height: 1.65; margin-bottom: 5px; font-size: 11pt; }

    /* ── Deal box ── */
    .deal-box {
      border: 1px solid #d4b8ff;
      border-radius: 6px;
      padding: 16px 20px;
      background: #faf5ff;
      font-family: Arial, sans-serif;
    }
    .deal-box table { width: 100%; border-collapse: collapse; }
    .deal-box td { padding: 5px 8px; font-size: 10.5pt; vertical-align: top; }
    .deal-box td:first-child { width: 160px; font-weight: 600; color: #4c1d95; }

    /* ── Custom terms ── */
    .custom-terms-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 14px 18px;
      font-size: 11pt;
      line-height: 1.65;
      white-space: pre-wrap;
    }

    /* ── Signature section ── */
    .sig-grid {
      display: flex;
      gap: 32px;
      margin-top: 8px;
    }
    .sig-block {
      flex: 1;
      border-top: 2px solid #1a1a2e;
      padding-top: 10px;
    }
    .sig-name {
      font-size: 14pt;
      font-style: italic;
      color: #4c1d95;
      min-height: 28px;
      font-family: 'Georgia', serif;
    }
    .sig-label  { font-size: 9pt; color: #555; margin-top: 4px; font-family: Arial, sans-serif; }
    .sig-date   { font-size: 9pt; color: #777; font-family: Arial, sans-serif; }
    .sig-pending {
      font-size: 10pt;
      color: #d97706;
      font-style: italic;
      font-family: Arial, sans-serif;
    }

    /* ── Footer ── */
    .contract-footer {
      margin-top: 40px;
      border-top: 1px solid #e9d5ff;
      padding-top: 12px;
      text-align: center;
      font-size: 8pt;
      color: #9ca3af;
      font-family: Arial, sans-serif;
    }

    /* ── Status banner ── */
    .status-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 6px;
      margin-bottom: 24px;
      font-family: Arial, sans-serif;
      font-size: 11pt;
      font-weight: 600;
    }
    .status-banner.signed   { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .status-banner.pending  { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

    /* ── Print styles ── */
    @media print {
      body { background: white; }
      .page { padding: 24px 40px; max-width: 100%; }
      .no-print { display: none !important; }
      @page { margin: 0; size: A4; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="contract-header">
      <div>
        <div class="brand-name">SPORTSCONNECT</div>
        <div class="brand-sub">Official Sponsorship Platform</div>
      </div>
      <div class="contract-meta">
        <div><strong>Contract No:</strong> ${contract.contractNumber}</div>
        <div><strong>Date:</strong> ${today}</div>
        <div><strong>Type:</strong> ${clauses.title}</div>
        <div><strong>Status:</strong> ${
          contract.status === 'fully_signed' ? '✓ Fully Signed'
          : contract.status === 'pending_athlete' ? 'Pending Athlete Signature'
          : 'Draft'
        }</div>
      </div>
    </div>

    <!-- Status Banner -->
    ${isSigned
      ? `<div class="status-banner signed">✓ This agreement has been duly signed by both parties and is legally binding.</div>`
      : `<div class="status-banner pending">⏳ This contract is pending all required signatures before it becomes effective.</div>`
    }

    <!-- Title -->
    <div class="contract-title">${clauses.title}</div>
    <div class="contract-subtitle">
      This Agreement is entered into as of ${today}, by and between the parties identified below.
    </div>

    <!-- Parties -->
    <table class="parties-table">
      <tr>
        <td>
          <div class="party-role">Sponsor</div>
          <div class="party-name">${sponsor?.company || sponsor?.name || 'Sponsor'}</div>
          ${sponsor?.industry ? `<div class="party-detail">Industry: ${sponsor.industry}</div>` : ''}
          ${sponsor?.name    ? `<div class="party-detail">Representative: ${sponsor.name}</div>` : ''}
        </td>
        <td>
          <div class="party-role">Athlete</div>
          <div class="party-name">${athlete?.name || 'Athlete'}</div>
          ${athlete?.sport    ? `<div class="party-detail">Sport: ${athlete.sport}</div>` : ''}
          ${athlete?.location ? `<div class="party-detail">Location: ${athlete.location}</div>` : ''}
        </td>
      </tr>
    </table>

    <!-- 1. Deal Details -->
    <div class="section">
      <div class="section-title">1. Deal Details</div>
      <div class="deal-box">
        <table>
          <tr><td>Title</td><td>${deal.title || 'As described below'}</td></tr>
          ${deal.description ? `<tr><td>Description</td><td>${deal.description}</td></tr>` : ''}
          <tr><td>Compensation</td><td>${fmtMoney(deal.value, deal.currency)}</td></tr>
          <tr><td>Start Date</td><td>${fmt(deal.startDate)}</td></tr>
          <tr><td>End Date</td><td>${fmt(deal.endDate)}</td></tr>
          ${sponsorship.notes ? `<tr><td>Notes</td><td>${sponsorship.notes}</td></tr>` : ''}
        </table>
      </div>
    </div>

    <!-- 2. Scope -->
    <div class="section">
      <div class="section-title">2. Scope of Agreement</div>
      <p>${clauses.scope}</p>
    </div>

    <!-- 3. Athlete Obligations -->
    <div class="section">
      <div class="section-title">3. Athlete Obligations</div>
      <ol>
        ${clauses.obligations.map(o => `<li>${o}</li>`).join('\n        ')}
      </ol>
    </div>

    <!-- 4. Sponsor Rights -->
    <div class="section">
      <div class="section-title">4. Sponsor Rights & Usage</div>
      <ol>
        ${clauses.rights.map(r => `<li>${r}</li>`).join('\n        ')}
      </ol>
    </div>

    <!-- 5. Exclusivity -->
    <div class="section">
      <div class="section-title">5. Exclusivity</div>
      <p>${clauses.exclusivity}</p>
    </div>

    <!-- 6. Payment -->
    <div class="section">
      <div class="section-title">6. Compensation & Payment</div>
      <p>The Sponsor agrees to pay the Athlete the agreed compensation of <strong>${fmtMoney(deal.value, deal.currency)}</strong> for fulfilling the obligations outlined in this Agreement. Payment shall be made as mutually agreed upon by both parties, and the Sponsor acknowledges that timely payment is a material obligation of this contract.</p>
    </div>

    <!-- 7. Termination -->
    <div class="section">
      <div class="section-title">7. Termination</div>
      <p>Either party may terminate this Agreement with <strong>fifteen (15) days</strong> written notice if the other party materially breaches any provision of this Agreement and fails to cure such breach within seven (7) days of receiving written notice thereof. Upon termination, the Athlete shall retain compensation earned up to the termination date, and the Sponsor shall retain rights to content already delivered.</p>
    </div>

    <!-- 8. Confidentiality -->
    <div class="section">
      <div class="section-title">8. Confidentiality</div>
      <p>Both parties agree to keep the financial terms and specific conditions of this Agreement confidential and not to disclose them to any third party without the prior written consent of the other party, except as required by law.</p>
    </div>

    <!-- 9. Governing Law -->
    <div class="section">
      <div class="section-title">9. Governing Law & Dispute Resolution</div>
      <p>This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising under this Agreement shall first be attempted to be resolved through mutual negotiation. If unresolved, disputes shall be submitted to binding arbitration in accordance with the Arbitration and Conciliation Act, 1996.</p>
    </div>

    <!-- 10. Custom Terms -->
    ${contract.customTerms?.trim() ? `
    <div class="section">
      <div class="section-title">10. Additional Terms & Conditions</div>
      <div class="custom-terms-box">${contract.customTerms.trim()}</div>
    </div>
    ` : ''}

    <!-- Signatures -->
    <div class="section" style="margin-top: 36px;">
      <div class="section-title">Signatures</div>
      <p style="margin-bottom: 20px; font-size: 10.5pt; color: #555;">
        By signing below, both parties agree to be legally bound by the terms and conditions of this Agreement.
        Electronic signatures executed on the SportsConnect platform are valid and enforceable.
      </p>
      <div class="sig-grid">
        <div class="sig-block">
          <div class="sig-name">${sponsorSig?.name || ''}</div>
          ${sponsorSig?.name
            ? `<div class="sig-label">${sponsor?.company || sponsor?.name}</div>
               <div class="sig-date">Signed: ${fmt(sponsorSig.signedAt)}</div>`
            : `<div class="sig-pending">Awaiting sponsor signature</div>`
          }
          <div class="sig-label" style="margin-top:8px">Sponsor / Authorised Representative</div>
        </div>
        <div class="sig-block">
          <div class="sig-name">${athleteSig?.name || ''}</div>
          ${athleteSig?.name
            ? `<div class="sig-label">${athlete?.name}</div>
               <div class="sig-date">Signed: ${fmt(athleteSig.signedAt)}</div>`
            : `<div class="sig-pending">Awaiting athlete signature</div>`
          }
          <div class="sig-label" style="margin-top:8px">Athlete</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="contract-footer">
      Generated by SportsConnect Platform &nbsp;|&nbsp; Contract ${contract.contractNumber}
      &nbsp;|&nbsp; This is a platform-facilitated agreement. Both parties are advised to seek independent legal counsel if required.
    </div>

  </div>
</body>
</html>`;
};

module.exports = { generateContractHTML, TEMPLATE_CLAUSES };
