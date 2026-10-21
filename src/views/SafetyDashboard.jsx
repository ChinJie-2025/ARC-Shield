import React, { useEffect, useState, useMemo } from 'react';
import { classifyIncident } from '../data/incidentTriage';
import './SafetyDashboard.css';
import TierSummaryPanel from './TierSummaryPanel';
import RepeatReportPanel from './RepeatReportPanel';

const getProfile = (incident) => incident.riskProfile || classifyIncident(incident.desc);

const initials = (name = 'Unassigned') => {
  if (!name || name === 'Unassigned') return '--';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const formatRemaining = (milliseconds) => {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours
    ? `${hours}h ${String(minutes).padStart(2, '0')}m`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function IncidentCard({ incident, onClaim, onRespond, onVerify, now, variant = 'standard' }) {
  const profile = getProfile(incident);
  const hasSla = Number.isFinite(profile.interveneMinutes);
  const deadline = hasSla ? incident.time + profile.interveneMinutes * 60000 : null;
  const left = deadline === null ? null : deadline - now;
  const isFinished = incident.status === 'Responded' || incident.status === 'Resolved';
  const overdue = hasSla && left <= 0 && !isFinished;

  const escalateDuration = profile.escalateMinutes ? profile.escalateMinutes * 60000 : null;
  const escalationDue = escalateDuration ? incident.time + escalateDuration : null;
  const escalated = escalationDue && now >= escalationDue && !isFinished;

  const riskKey = (incident.risk || 'Low').toLowerCase();

  return (
    <article className={`priority-card risk-border-${riskKey} ${overdue ? 'card-breached' : ''} ${variant === 'compact' ? 'card-compact' : ''}`}>
      <div className="card-header-row">
        <div className="header-tags">
          <span className={`ios-badge badge-${riskKey}`}>
            <span className="badge-pulse-dot" />
            {incident.risk === 'Unclear' ? 'NEEDS REVIEW' : `${incident.risk.toUpperCase()} • P${profile.priority ?? 3}`}
          </span>
          <span className="incident-token">{incident.id}</span>
        </div>
        <span className="incident-clock">
          {new Date(incident.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="card-main-content">
        <h3 className="incident-title">{incident.desc}</h3>
        <p className="incident-location-pin">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{incident.location}</span>
        </p>

        {/* Python NLP classification — informational only */}
        <section
          className="nlp-classification-card"
          aria-label="Python NLP hazard classification"
        >
          <div className="nlp-classification-card__header">
            <span className="nlp-classification-card__label">
              PYTHON NLP CLASSIFICATION
            </span>
            <span className="nlp-classification-card__status">
              {incident.nlpResult ? 'Prediction available' : 'Not classified'}
            </span>
          </div>

          {incident.nlpResult ? (
            <>
              <p>
                <strong>Predicted category:</strong>{' '}
                {(incident.nlpResult.predicted_category || 'Unknown')
                  .replace(/_/g, ' ')}
              </p>

              <p>
                <strong>Model confidence:</strong>{' '}
                {Number.isFinite(incident.nlpResult.confidence)
                  ? `${(incident.nlpResult.confidence * 100).toFixed(1)}%`
                  : 'Unavailable'}
              </p>

              <p>
                <strong>Model version:</strong>{' '}
                {incident.nlpResult.model_version || 'Unknown'}
              </p>
            </>
          ) : (
            <p className="nlp-classification-card__empty">
              No NLP prediction was saved for this incident.
            </p>
          )}

          <small>
            Informational prediction only. Follow operational risk protocols
            and never delay emergency action while awaiting classification.
          </small>
        </section>

        {incident.image && (
          <div className="card-media-shell">
            <img className="card-media-img" src={incident.image} alt="Field evidence" />
          </div>
        )}

        <div className={`sla-ribbon ${overdue ? 'sla-breach' : ''} ${incident.status === 'Responded' ? 'sla-cleared' : ''}`}>
          <div className="sla-ribbon-split">
            <span className="sla-ribbon-label">
              {incident.status === 'Responded' ? 'INTERVENTION LOGGED' : !hasSla ? 'PRIORITY REVIEW' : overdue ? 'SLA EXPIRED' : 'SLA DEADLINE'}
            </span>
            <span className="sla-ribbon-countdown">
              {incident.status === 'Responded'
                ? 'Recorded'
                : !hasSla
                ? 'Awaiting review'
                : overdue
                ? `Late ${formatRemaining(-left)}`
                : formatRemaining(left)}
            </span>
          </div>
          <div className="sla-ribbon-sub">{profile.sla}</div>
        </div>

        {escalationDue && (
          <div className={`escalation-pill ${escalated ? 'is-escalated' : ''}`}>
            <span className="escalation-dot" />
            <span>
              {escalated ? 'Executive Escalation Dispatched' : `Escalation in ${formatRemaining(escalationDue - now)}`}
            </span>
          </div>
        )}

        <div className="card-footer-info">
          <div className="agent-wrap">
            <span className="agent-circle">{initials(incident.assignee)}</span>
            <span className="agent-name-text">{incident.assignee || 'Unassigned'}</span>
          </div>
          <div className="units-wrap">
            <span className="units-caption">DISPATCH</span>
            <span className="units-text">{profile.teams?.join(', ') || 'Facility Staff'}</span>
          </div>
        </div>
      </div>

      <div className="card-action-bar">
        {incident.status === 'Reported' && (
          <button type="button" className="btn-action-primary" onClick={() => onClaim(incident.id)}>
            Claim Incident &rarr;
          </button>
        )}
        {incident.status === 'Assigned' && (
          <button type="button" className="btn-action-respond" onClick={() => onRespond(incident.id)}>
            Record Intervention
          </button>
        )}
        {incident.status === 'Responded' && (
          <button type="button" className="btn-action-verify" onClick={() => onVerify(incident)}>
            Verify &amp; Close Ticket
          </button>
        )}
        {incident.status === 'Resolved' && (
          <div className="resolved-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Verified: {incident.evidence || 'Field resolution logged'}</span>
          </div>
        )}
      </div>
    </article>
  );
}

export default function SafetyDashboard({ incidents, setIncidents, currentRole = 'Executive', tierSummary, onTierSummaryChange }) {
  const role = currentRole; // Driven by the authenticated session

  // ---- State (these were missing) ----
  const [now, setNow] = useState(() => Date.now());
  const [viewMode, setViewMode] = useState('priority');
  const [verifyModal, setVerifyModal] = useState(null);
  const [evidenceMsg, setEvidenceMsg] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState('');

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const resetModal = () => {
    setVerifyModal(null);
    setEvidenceMsg('');
    setEvidencePhoto('');
  };

  // Cancel / dismiss: discard the preview blob
  const closeModal = () => {
    if (evidencePhoto && evidencePhoto.startsWith('blob:')) {
      URL.revokeObjectURL(evidencePhoto);
    }
    resetModal();
  };

  // Keyboard shortcut listener to close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && verifyModal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [verifyModal, evidencePhoto]);

  const claim = (id) =>
    setIncidents((items) =>
      items.map((item) => (item.id === id ? { ...item, status: 'Assigned', assignee: 'Duty Officer' } : item))
    );

  const respond = (id) =>
    setIncidents((items) =>
      items.map((item) => (item.id === id ? { ...item, status: 'Responded', respondedAt: Date.now() } : item))
    );

  const handleEvidencePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (evidencePhoto && evidencePhoto.startsWith('blob:')) {
        URL.revokeObjectURL(evidencePhoto);
      }
      setEvidencePhoto(URL.createObjectURL(file));
    }
  };

  const submitVerification = (event) => {
    event.preventDefault();
    if (!evidenceMsg.trim() && !evidencePhoto) return;
    setIncidents((items) =>
      items.map((item) =>
        item.id === verifyModal.id
          ? {
              ...item,
              status: 'Resolved',
              evidence: evidenceMsg.trim() || 'Visual audit confirmed',
              evidencePhoto,
            }
          : item
      )
    );
    // Do not revoke the blob URL here: the saved incident still uses it.
    resetModal();
  };

  const active = useMemo(() => incidents.filter((item) => item.status !== 'Resolved'), [incidents]);

  const urgentIncident = useMemo(() => {
    return active
      .filter((i) => i.status !== 'Responded')
      .filter((i) => i.risk !== 'Unclear')
      .sort((a, b) => {
        const pA = getProfile(a).priority ?? 9;
        const pB = getProfile(b).priority ?? 9;
        return pA - pB || a.time - b.time;
      })[0] || null;
  }, [active]);

  const escalated = useMemo(
    () =>
      active.filter((item) => {
        const profile = getProfile(item);
        return (
          profile.escalateMinutes &&
          now >= item.time + profile.escalateMinutes * 60000 &&
          item.status !== 'Responded'
        );
      }),
    [active, now]
  );

  const highCriticalCount = useMemo(
    () => active.filter((item) => ['High', 'Critical'].includes(item.risk)).length,
    [active]
  );

  const resolvedCount = useMemo(
    () => incidents.filter((item) => item.status === 'Resolved').length,
    [incidents]
  );

  const criticalTier = useMemo(
    () => active.filter((item) => ['Critical', 'High'].includes(item.risk)),
    [active]
  );
  const moderateTier = useMemo(
    () => active.filter((item) => item.risk === 'Moderate' || item.risk === 'Medium'),
    [active]
  );
  const lowTier = useMemo(
    () => active.filter((item) => item.risk === 'Low'),
    [active]
  );
  const reviewTier = useMemo(
    () => active.filter((item) => item.risk === 'Unclear'),
    [active]
  );
  const resolvedList = useMemo(
    () => incidents.filter((item) => item.status === 'Resolved'),
    [incidents]
  );

  const pipelineStages = ['Reported', 'Assigned', 'Responded', 'Resolved'];

  return (
    <div className="priority-dashboard-layout">
      {/* Top Header */}
      <header className="dashboard-hero-header">
        <div>
          <div className="header-kicker-line">
            <span className="kicker-tag">INCIDENT COMMAND CENTER</span>
            <span className="kicker-sep">•</span>
            <span className="kicker-sub">REAL-TIME RISK TRIAGE</span>
          </div>
          <h1 className="header-primary-title">Operational Safety Intelligence</h1>
          <p className="header-sub-copy">
            Priority-tiered dispatch matrix. Immediate life-safety items take top routing precedence.
          </p>
        </div>

        <div className="header-widget-group">
          <div className="status-live-capsule">
            <span className="live-halo" />
            LIVE DISPATCH PIPELINE
          </div>
          <div className="perspective-dropdown-box">
            <span className="dropdown-label">Session:</span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{role}</span>
          </div>
        </div>
      </header>

      {/* Asymmetric Tiered KPI Cards */}
      <section className="kpi-hierarchy-grid">
        <div className={`kpi-hero-card ${highCriticalCount > 0 ? 'kpi-hero-active' : ''}`}>
          <div className="kpi-hero-head">
            <div>
              <span className="kpi-hero-label">HIGH &amp; CRITICAL DISPATCH</span>
              <span className="kpi-hero-sub">Immediate action required</span>
            </div>
            <span className="kpi-hero-badge">{highCriticalCount > 0 ? 'ACTION NEEDED' : 'NOMINAL'}</span>
          </div>
          <div className="kpi-hero-body">
            <span className="kpi-hero-number">{String(highCriticalCount).padStart(2, '0')}</span>
            <div className="kpi-hero-desc">
              <strong>{highCriticalCount} urgent incident{highCriticalCount === 1 ? '' : 's'}</strong> active across property sectors. P1/P2 response clocks ticking.
            </div>
          </div>
        </div>

        <div className="kpi-card-subtle">
          <div className="subtle-label-row">
            <span>Executive Escalations</span>
            <span className={`subtle-indicator ${escalated.length ? 'bg-danger' : 'bg-gray'}`} />
          </div>
          <span className={`subtle-number ${escalated.length ? 'text-danger' : ''}`}>
            {String(escalated.length).padStart(2, '0')}
          </span>
          <span className="subtle-note">{escalated.length ? 'Threshold breached' : 'All SLAs within target'}</span>
        </div>

        <div className="kpi-card-subtle">
          <div className="subtle-label-row">
            <span>Total Open Tickets</span>
            <span className="subtle-indicator bg-info" />
          </div>
          <span className="subtle-number">{String(active.length).padStart(2, '0')}</span>
          <span className="subtle-note">Across all risk tiers</span>
        </div>

        <div className="kpi-card-subtle">
          <div className="subtle-label-row">
            <span>Verified Resolved</span>
            <span className="subtle-indicator bg-success" />
          </div>
          <span className="subtle-number text-success">{String(resolvedCount).padStart(2, '0')}</span>
          <span className="subtle-note">Audit verified field closures</span>
        </div>
      </section>

      <TierSummaryPanel incidents={incidents} tierSummary={tierSummary} onTierSummaryChange={onTierSummaryChange} />
      <RepeatReportPanel incidents={incidents} />

      {/* Immediate Attention Hero Spotlight */}
      {urgentIncident && (
        <section className="spotlight-hero-card">
          <div className="spotlight-eyebrow-bar">
            <div className="spotlight-lead">
              <span className="spotlight-flame">⚡</span>
              <span className="spotlight-tag">HIGHEST PRIORITY INCIDENT REQUIRES DISPATCH</span>
            </div>
            <span className="spotlight-time">
              Reported {new Date(urgentIncident.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="spotlight-body-layout">
            <div className="spotlight-main">
              <div className="spotlight-pill-row">
                <span className={`spotlight-badge risk-${urgentIncident.risk.toLowerCase()}`}>
                  {urgentIncident.risk.toUpperCase()} SEVERITY • P{getProfile(urgentIncident).priority ?? 1}
                </span>
                <span className="spotlight-ticket-id">{urgentIncident.id}</span>
                <span className="spotlight-status-pill">{urgentIncident.status.toUpperCase()}</span>
              </div>
              <h2 className="spotlight-headline">{urgentIncident.desc}</h2>
              <p className="spotlight-location">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <strong>{urgentIncident.location}</strong>
              </p>
            </div>

            <div className="spotlight-sidebar-action">
              <div className="spotlight-sla-box">
                <span className="sla-caption-text">INTERVENTION TARGET</span>
                <strong className="sla-countdown-bold">
                  {formatRemaining((urgentIncident.time + (getProfile(urgentIncident).interveneMinutes ?? 15) * 60000) - now)}
                </strong>
                <span className="sla-micro-text">{getProfile(urgentIncident).sla}</span>
              </div>
              {urgentIncident.status === 'Reported' && (
                <button
                  type="button"
                  className="spotlight-claim-button"
                  onClick={() => claim(urgentIncident.id)}
                >
                  Claim &amp; Dispatch Units &rarr;
                </button>
              )}
              {urgentIncident.status === 'Assigned' && (
                <button
                  type="button"
                  className="spotlight-claim-button btn-respond"
                  onClick={() => respond(urgentIncident.id)}
                >
                  Log On-Site Response &rarr;
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* View Switcher Deck */}
      <section className="board-control-row">
        <div className="board-heading-block">
          <h2 className="board-primary-heading">
            {viewMode === 'priority' ? 'Priority Urgency Matrix' : 'Pipeline Stage Workflow'}
          </h2>
          <span className="board-total-count">{active.length} active tickets</span>
        </div>

        <div className="view-mode-segmented">
          <button
            type="button"
            className={`view-segment-btn ${viewMode === 'priority' ? 'is-active' : ''}`}
            onClick={() => setViewMode('priority')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Priority Hierarchy View
          </button>
          <button
            type="button"
            className={`view-segment-btn ${viewMode === 'pipeline' ? 'is-active' : ''}`}
            onClick={() => setViewMode('pipeline')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Pipeline Status View
          </button>
        </div>
      </section>

      {/* VIEW 1: PRIORITY HIERARCHY MATRIX */}
      {viewMode === 'priority' && (
        <div className="priority-hierarchy-container">
          {reviewTier.length > 0 && (
            <div className="hierarchy-lane lane-review">
              <div className="lane-header-row">
                <div className="lane-title-cluster">
                  <span className="lane-status-badge badge-review">UNCLASSIFIED • NEEDS REVIEW</span>
                  <span className="lane-subtext">No recognized hazard keywords; an operator must clarify and assign priority.</span>
                </div>
                <span className="lane-count-tag">{reviewTier.length}</span>
              </div>
              <div className="hierarchy-card-deck">
                {reviewTier.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    now={now}
                    onClaim={claim}
                    onRespond={respond}
                    onVerify={setVerifyModal}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="hierarchy-lane lane-critical">
            <div className="lane-header-row">
              <div className="lane-title-cluster">
                <span className="lane-status-badge badge-critical">TIER 1 • URGENT PRIORITY</span>
                <span className="lane-subtext">Immediate safety risks &amp; SLA breaches</span>
              </div>
              <span className="lane-count-tag">{criticalTier.length}</span>
            </div>

            <div className="hierarchy-card-deck">
              {criticalTier.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  now={now}
                  onClaim={claim}
                  onRespond={respond}
                  onVerify={setVerifyModal}
                />
              ))}
              {criticalTier.length === 0 && (
                <div className="empty-lane-callout">
                  <span className="empty-lane-check">✓</span>
                  <span>No critical incidents active. Safety perimeter secure.</span>
                </div>
              )}
            </div>
          </div>

          <div className="hierarchy-split-row">
            <div className="hierarchy-lane lane-moderate">
              <div className="lane-header-row">
                <div className="lane-title-cluster">
                  <span className="lane-status-badge badge-moderate">TIER 2 • ACTIVE WATCH</span>
                  <span className="lane-subtext">Water pooling, maintenance hazards</span>
                </div>
                <span className="lane-count-tag">{moderateTier.length}</span>
              </div>

              <div className="hierarchy-card-deck">
                {moderateTier.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    now={now}
                    onClaim={claim}
                    onRespond={respond}
                    onVerify={setVerifyModal}
                  />
                ))}
                {moderateTier.length === 0 && (
                  <div className="empty-lane-callout">
                    <span>No moderate incidents currently logged.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="hierarchy-lane lane-routine">
              <div className="lane-header-row">
                <div className="lane-title-cluster">
                  <span className="lane-status-badge badge-routine">TIER 3 • ROUTINE &amp; CLOSED</span>
                  <span className="lane-subtext">Minor tickets &amp; verified resolutions</span>
                </div>
                <span className="lane-count-tag">{lowTier.length + resolvedList.length}</span>
              </div>

              <div className="hierarchy-card-deck">
                {lowTier.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    now={now}
                    onClaim={claim}
                    onRespond={respond}
                    onVerify={setVerifyModal}
                  />
                ))}
                {resolvedList.slice(0, 3).map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    now={now}
                    onClaim={claim}
                    onRespond={respond}
                    onVerify={setVerifyModal}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PIPELINE STAGES */}
      {viewMode === 'pipeline' && (
        <div className="pipeline-kanban-flow">
          {pipelineStages.map((status) => {
            const columnItems = incidents
              .filter((item) => item.status === status)
              .sort((a, b) => (getProfile(a).priority ?? 9) - (getProfile(b).priority ?? 9) || a.time - b.time);

            return (
              <div className="pipeline-column-box" key={status}>
                <div className="column-top-line">
                  <span className="column-title-label">{status}</span>
                  <span className="column-count-chip">{columnItems.length}</span>
                </div>
                <div className="column-card-stack">
                  {columnItems.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      now={now}
                      onClaim={claim}
                      onRespond={respond}
                      onVerify={setVerifyModal}
                    />
                  ))}
                  {columnItems.length === 0 && (
                    <div className="empty-pipeline-slot">
                      <span>No {status.toLowerCase()} tickets</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal with Scrim Click & Keyboard Dismissal */}
      {verifyModal && (
        <div
          className="ios-modal-scrim"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <form className="ios-modal-card" onSubmit={submitVerification}>
            <div className="modal-header-line">
              <div>
                <span className="modal-eyebrow">AUDIT &amp; RESOLUTION CLOSURE</span>
                <h3 className="modal-lead-title">Field Verification Entry</h3>
                <p className="modal-target-info">
                  <strong>{verifyModal.id}</strong> • {verifyModal.location}
                </p>
              </div>
              <button type="button" className="btn-modal-dismiss" onClick={closeModal} aria-label="Close dialog">
                ✕
              </button>
            </div>

            <div className="modal-form-body">
              <label className="ios-field-block">
                <span className="field-headline">Resolution Notes <small>(Required without photo)</small></span>
                <textarea
                  className="ios-glass-textarea"
                  value={evidenceMsg}
                  onChange={(e) => setEvidenceMsg(e.target.value)}
                  placeholder="Detail actions taken, hazard removed, or verification notes..."
                  rows={4}
                />
              </label>

              <div className="ios-field-block">
                <span className="field-headline">Verification Image Capture</span>
                <label className="ios-glass-dropzone">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Select or snap photo evidence</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="visually-hidden"
                    onChange={handleEvidencePhoto}
                  />
                </label>
              </div>

              {evidencePhoto && (
                <div className="preview-modal-wrapper">
                  <img src={evidencePhoto} alt="Verification preview" />
                </div>
              )}
            </div>

            <div className="modal-actions-tray">
              <button type="button" className="btn-ios-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-ios-primary"
                disabled={!evidenceMsg.trim() && !evidencePhoto}
              >
                Sign Off &amp; Close Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
