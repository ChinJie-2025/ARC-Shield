import React, { useState, useEffect } from 'react';
import { classifyIncident } from '../data/incidentTriage';
import './ReportPortal.css';

export default function ReportPortal({ onSubmit = () => {} }) {
  const [status, setStatus] = useState('idle');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPS Tracking States
  const [isLocating, setIsLocating] = useState(false);
  const [geoCoords, setGeoCoords] = useState(null);
  const [geoError, setGeoError] = useState('');

  const triage = classifyIncident(description) || {
    risk: 'Low',
    reason: '',
    teams: [],
    sla: 'Within 24 hours',
  };

  const hasDescription = Boolean(description.trim());

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // GPS Geolocation Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS tracking is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const lat = latitude.toFixed(5);
        const lng = longitude.toFixed(5);
        const acc = Math.round(accuracy);

        setGeoCoords({ lat, lng, acc });
        // Populate or append to existing location text
        const gpsTag = `[GPS: ${lat}, ${lng} (±${acc}m)]`;
        setLocation((prev) => (prev ? `${prev} ${gpsTag}` : gpsTag));
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Please enter manually.');
        } else {
          setGeoError('Unable to retrieve precise GPS location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClearGps = () => {
    setGeoCoords(null);
    setGeoError('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const riskProfile = classifyIncident(description);
    const payload = {
      id: `ARC-${Date.now().toString().slice(-6)}`,
      location: location.trim(),
      geoCoords: geoCoords || null,
      desc: description.trim(),
      risk: riskProfile?.risk || 'Low',
      riskProfile,
      status: 'Reported',
      time: Date.now(),
      image: preview,
      reporter: 'Resident',
    };

    try {
      await onSubmit(payload);
      setStatus('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setStatus('idle');
    setPreview('');
    setDescription('');
    setLocation('');
    setGeoCoords(null);
    setGeoError('');
  };

  if (status === 'success') {
    return (
      <div className="portal-viewport">
        <section className="glass-success-panel" role="alert" aria-live="polite">
          <div className="success-halo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="success-eyebrow">DISPATCH CONFIRMED</span>
          <h1 className="success-headline">Incident Logged</h1>
          <p className="success-subtext">
            Your safety report has been prioritized and routed to the operational facility duty desk.
          </p>

          <div className="success-meta-dock">
            <div className="meta-dock-item">
              <span className="dock-label">Status</span>
              <span className="dock-value text-blue">Queued for Action</span>
            </div>
            <div className="meta-dock-item">
              <span className="dock-label">Classification</span>
              <span className="dock-value">{triage.risk.toUpperCase()}</span>
            </div>
            <div className="meta-dock-item">
              <span className="dock-label">Target SLA</span>
              <span className="dock-value font-mono">{triage.sla}</span>
            </div>
          </div>

          <p className="success-disclaimer">
            If this condition presents an immediate threat to life, evacuate immediately and notify official emergency services.
          </p>

          <button type="button" className="btn-portal-secondary" onClick={resetForm}>
            Submit Another Report
          </button>
        </section>
      </div>
    );
  }

  const riskClass = hasDescription ? triage.risk.toLowerCase() : 'neutral';

  return (
    <div className="portal-viewport">
      <div className="portal-glass-shell">
        {/* Left Column: Context, Hierarchy & Emergency Protocol */}
        <aside className="portal-guide-sidebar">
          <div>
            <div className="guide-kicker-line">
              <span className="kicker-brand">ARC-SHIELD OS</span>
              <span className="kicker-bullet">•</span>
              <span className="kicker-node">INCIDENT INTAKE</span>
            </div>
            <h1 className="guide-hero-title">Report a Safety Hazard</h1>
            <p className="guide-hero-lead">
              Direct connection to facility engineering and perimeter security. Reports are analyzed in real time to suggest intervention urgency.
            </p>
          </div>

          <div className="emergency-callout-glass">
            <div className="emergency-badge-dot" />
            <div>
              <h4 className="emergency-callout-title">Life-Safety Emergency?</h4>
              <p className="emergency-callout-desc">
                For active fires, gas leaks, physical structural failure, or medical emergencies, evacuate and dial emergency services immediately.
              </p>
            </div>
          </div>

          <div className="ai-status-card-glass">
            <div className="ai-header-row">
              <div className="ai-pulse-dot" />
              <span className="ai-title-tag">Live Triage Intelligence</span>
            </div>
            <p className="ai-copy-text">
              Natural language models compute SLA deadlines, recommended response teams, and hazard priority as you type.
            </p>
          </div>
        </aside>

        {/* Right Column: Submission Form */}
        <main className="portal-input-surface">
          <div className="surface-header-bar">
            <div>
              <h2 className="surface-title">Hazard Details</h2>
              <p className="surface-subtitle">Provide precise physical landmarks and visible conditions.</p>
            </div>
            <span className="surface-badge-req">* Required</span>
          </div>

          <form onSubmit={handleSubmit} className="portal-entry-form" noValidate={false}>
            {/* Location Input with Integrated GPS */}
            <div className="input-group-ios">
              <div className="label-row-between">
                <label htmlFor="hazard-location" className="label-ios">
                  Exact Location <span className="req-asterisk">*</span>
                </label>
                <button
                  type="button"
                  className={`btn-gps-trigger ${isLocating ? 'is-locating' : ''} ${geoCoords ? 'has-coords' : ''}`}
                  onClick={handleGetLocation}
                  disabled={isLocating}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                  <span>{isLocating ? 'Locating...' : geoCoords ? 'Update GPS' : 'Auto-Detect GPS'}</span>
                </button>
              </div>

              <div className="input-affix-shell">
                <span className="input-affix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <input
                  id="hazard-location"
                  required
                  type="text"
                  className="input-ios has-icon"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Tower B, Basement 2 car park, near pillar 14C"
                />
              </div>

              {/* Live GPS Telemetry Chip */}
              {geoCoords && (
                <div className="gps-pill-feedback">
                  <div className="gps-pill-left">
                    <span className="gps-signal-dot" />
                    <span className="gps-coords-text">
                      GPS Locked: {geoCoords.lat}° N, {geoCoords.lng}° E (±{geoCoords.acc}m)
                    </span>
                  </div>
                  <button type="button" className="btn-gps-clear" onClick={handleClearGps} aria-label="Clear GPS">
                    ✕
                  </button>
                </div>
              )}

              {geoError && <p className="gps-error-notice">{geoError}</p>}
            </div>

            {/* Description Input */}
            <div className="input-group-ios">
              <label htmlFor="hazard-description" className="label-ios">
                What did you notice? <span className="req-asterisk">*</span>
              </label>
              <textarea
                id="hazard-description"
                required
                rows={4}
                className="textarea-ios"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe visible damage, fluid spills, blocked emergency exits, sparking electricals, or safety concerns..."
              />
            </div>

            {/* Photo Upload Area */}
            <div className="input-group-ios">
              <label className="label-ios">
                Photo Evidence <span className="opt-tag">(Optional)</span>
              </label>
              <div className={`media-uploader-box ${preview ? 'has-preview' : ''}`}>
                {preview ? (
                  <div className="preview-media-shell">
                    <img className="preview-media-img" src={preview} alt="Hazard preview" />
                    <button
                      type="button"
                      className="btn-media-remove"
                      onClick={handleRemovePhoto}
                      aria-label="Remove image"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <label className="dropzone-interactive-label">
                    <div className="dropzone-bubble-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <span className="dropzone-main-text">Attach or capture a photo</span>
                    <span className="dropzone-sub-text">PNG, JPG or HEIC up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="visually-hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Dynamic AI Triage Card */}
            <div className={`ai-triage-dock risk-${riskClass}`}>
              <div className="triage-status-row">
                <div className="triage-left-cluster">
                  <span className="triage-label-kicker">AI CLASSIFICATION SUGGESTION</span>
                  <span className="triage-severity-pill">
                    {hasDescription ? triage.risk.toUpperCase() : 'AWAITING DETAILS'}
                  </span>
                </div>
                <div className="triage-sla-meta">
                  <span className="sla-caption">Target SLA:</span>
                  <strong className="sla-timer-target">{hasDescription ? triage.sla : '—'}</strong>
                </div>
              </div>

              <p className="triage-reason-copy">
                {hasDescription
                  ? triage.reason
                  : 'Enter a description above to calculate suggested risk priority and route response units.'}
              </p>

              {hasDescription && triage.teams?.length > 0 && (
                <div className="triage-teams-cluster">
                  <span className="teams-caption">Suggested Units:</span>
                  <div className="teams-pills-wrap">
                    {triage.teams.map((team, idx) => (
                      <span key={idx} className="team-capsule">{team}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="portal-actions-row">
              <button
                type="submit"
                disabled={isSubmitting || !location.trim() || !description.trim()}
                className="btn-portal-submit"
              >
                {isSubmitting ? (
                  <span>Transmitting...</span>
                ) : (
                  <>
                    <span>Submit Incident Report</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
              <p className="portal-privacy-note">
                Logged reports are recorded securely to the ARC-Shield operational safety ledger.
              </p>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}