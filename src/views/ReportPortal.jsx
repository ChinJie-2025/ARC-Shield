import React, { useState, useEffect } from 'react';
import { classifyIncident } from '../data/incidentTriage';
import './ReportPortal.css';

export default function ReportPortal({ onSubmit = () => {} }) {
  const [status, setStatus] = useState('idle');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [geminiAssessment, setGeminiAssessment] = useState(null);
  const [geminiError, setGeminiError] = useState('');
  
  // Python NLP classifier state
  const [isNlpLoading, setIsNlpLoading] = useState(false);
  const [nlpResult, setNlpResult] = useState(null);
  const [nlpError, setNlpError] = useState('');

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

  const requestGeminiAssessment = async () => {
    setIsGeminiLoading(true);
    setGeminiError('');
    setGeminiAssessment(null);
    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), location: location.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gemini assessment is unavailable.');
      setGeminiAssessment(data.assessment);
    } catch (error) {
      setGeminiError(error instanceof TypeError
        ? 'Cannot reach the ARC-Shield API. Start the app with “npm run dev:all”, then try again.'
        : error.message || 'Unable to reach the Gemini service.');
    } finally {
      setIsGeminiLoading(false);
    }
  };

  const requestNlpClassification = async () => {
  const reportText = description.trim();

  if (!reportText || isNlpLoading) return;

  setIsNlpLoading(true);
  setNlpError('');
  setNlpResult(null);

  try {
    const apiBaseUrl = import.meta.env.VITE_NLP_API_URL?.replace(/\/+$/, '');

    if (!apiBaseUrl) {
      throw new Error('The NLP API URL has not been configured.');
    }

    const response = await fetch(`${apiBaseUrl}/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        report_text: reportText,
      }),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 503
          ? 'The classifier is temporarily unavailable. Please try again.'
          : `Classification failed (HTTP ${response.status}).`
      );
    }

    const data = await response.json();

    if (
      typeof data.predicted_category !== 'string' ||
      typeof data.confidence !== 'number'
    ) {
      throw new Error('The NLP API returned an unexpected response.');
    }

    setNlpResult(data);
  } catch (error) {
    setNlpError(
      error instanceof TypeError
        ? 'Unable to connect to the NLP service. It may be starting up; please try again.'
        : error.message || 'Classification could not be completed.'
    );
  } finally {
    setIsNlpLoading(false);
  }
};

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

      // Preserve the Python NLP result with the incident.
      nlpResult: nlpResult
        ? {
            predicted_category: nlpResult.predicted_category,
            confidence: nlpResult.confidence,
            model_version: nlpResult.model_version || 'Unknown',
          }
        : null,
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
    setGeminiAssessment(null);
    setGeminiError('');
    setLocation('');
    setGeoCoords(null);
    setGeoError('');
    setNlpResult(null);
    setNlpError('');
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
    <div className="portal-viewport report-experience">
      <div className="portal-glass-shell report-submit-layout">
        <div className="report-quick-guide" aria-label="Quick report guide">
          <strong>Quick guide</strong>
          <span><b>1</b> Location</span>
          <span><b>2</b> Describe the issue</span>
          <span><b>3</b> Photo optional</span>
          <small>For immediate danger, move to safety and call emergency services.</small>
        </div>

        <main className="portal-input-surface report-form-card">
          <div className="report-form-card__header">
            <div>
              <span className="report-form-card__eyebrow">NEW REPORT</span>
              <h2>Incident details</h2>
              <p>Fields marked with <span>*</span> are required.</p>
            </div>
            <span className="report-form-card__secure" title="Your report is sent to the property response queue">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="8" width="12" height="9" rx="2" />
                <path d="M7 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              Property team
            </span>
          </div>

          <form onSubmit={handleSubmit} className="portal-entry-form" noValidate={false}>
            {/* Location Input with Integrated GPS */}
            <div className="input-group-ios">
              <div className="label-row-between">
                <label htmlFor="hazard-location" className="label-ios report-field-label">
                  <span className="report-field-label__index">01</span>
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
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setGeminiAssessment(null);
                  }}
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
              <label htmlFor="hazard-description" className="label-ios report-field-label">
                <span className="report-field-label__index">02</span>
                What did you notice? <span className="req-asterisk">*</span>
              </label>
              <textarea
                id="hazard-description"
                required
                rows={4}
                className="textarea-ios"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setGeminiAssessment(null);
                  setGeminiError('');
                  setNlpResult(null);
                  setNlpError('');
                }}
                placeholder="Describe visible damage, fluid spills, blocked emergency exits, sparking electricals, or safety concerns..."
              />
            </div>

            {/* Photo Upload Area */}
            <div className="input-group-ios">
              <label className="label-ios report-field-label">
                <span className="report-field-label__index">03</span>
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

            {/* Rules-based triage and optional Gemini review */}
            <div className={`ai-triage-dock risk-${riskClass}`}>
              <div className="triage-status-row">
                <div className="triage-left-cluster">
                  <span className="triage-label-kicker">RULE-BASED CLASSIFICATION</span>
                  <span className="triage-severity-pill">
                    {hasDescription ? (triage.isRecognized ? triage.risk.toUpperCase() : 'NEEDS REVIEW') : 'AWAITING DETAILS'}
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

              <section className="gemini-review-panel" aria-label="Gemini safety review">
                <div className="gemini-review-panel__header">
                  <div className="gemini-review-panel__identity">
                    <span className="gemini-review-panel__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3 13.9 9.1 20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z" />
                        <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
                      </svg>
                    </span>
                    <div className="gemini-review-panel__copy">
                      <span className="gemini-review-panel__eyebrow">AI ASSIST</span>
                      <h3>Gemini safety review</h3>
                      <p>A second look at urgency, response steps, and teams.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="gemini-review-button"
                    onClick={requestGeminiAssessment}
                    disabled={!hasDescription || isGeminiLoading}
                    aria-busy={isGeminiLoading}
                  >
                    {isGeminiLoading ? (
                      <><span className="gemini-review-spinner" aria-hidden="true" /> Reviewing</>
                    ) : (
                      <>
                        <span>{geminiAssessment ? 'Run again' : 'Review report'}</span>
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 10h11m-4-4 4 4-4 4" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {!hasDescription && !geminiError && (
                  <p className="gemini-review-panel__prompt">Add an incident description to request an AI review.</p>
                )}
                {geminiError && <p className="gemini-review-error" role="alert">{geminiError}</p>}

                {geminiAssessment && (
                  <section className={`gemini-review-result risk-${geminiAssessment.risk.toLowerCase()}`} aria-live="polite">
                    <div className="gemini-review-result__topline">
                      <span className="gemini-review-result__label">ASSESSMENT</span>
                      <span className={`gemini-risk-pill gemini-risk-pill--${geminiAssessment.risk.toLowerCase()}`}>
                        {geminiAssessment.risk} priority
                      </span>
                    </div>
                    <p className="gemini-review-result__summary">{geminiAssessment.summary}</p>

                    {geminiAssessment.recommendedActions?.length > 0 && (
                      <div className="gemini-review-result__section">
                        <h4>Recommended next steps</h4>
                        <ul className="gemini-action-list">
                          {geminiAssessment.recommendedActions.map((action, index) => (
                            <li key={`${index}-${action}`}>
                              <span>{String(index + 1).padStart(2, '0')}</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {geminiAssessment.suggestedTeams?.length > 0 && (
                      <div className="gemini-review-result__section">
                        <h4>Teams to consider</h4>
                        <div className="gemini-team-list">
                          {geminiAssessment.suggestedTeams.map((team, index) => <span key={`${index}-${team}`}>{team}</span>)}
                        </div>
                      </div>
                    )}

                    <div className="gemini-review-result__notice">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10 2.5 16 5v4.7c0 3.5-2.5 6-6 7.8-3.5-1.8-6-4.3-6-7.8V5l6-2.5Z" />
                        <path d="m7.5 9.8 1.7 1.7 3.4-3.6" />
                      </svg>
                      <span>{geminiAssessment.advisory}</span>
                    </div>
                  </section>
                )}
              </section>

              {/* Python NLP hazard classifier */}
              <section
                className="gemini-review-panel"
                aria-label="NLP hazard classification"
              >
                <div className="gemini-review-panel__header">
                  <div className="gemini-review-panel__identity">
                    <span
                      className="gemini-review-panel__icon"
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 3 13.9 9.1 20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z" />
                        <path d="M5 19h4m-2-2v4" />
                      </svg>
                    </span>

                    <div className="gemini-review-panel__copy">
                      <span className="gemini-review-panel__eyebrow">
                        PYTHON NLP CLASSIFIER
                      </span>

                      <h3>Hazard category prediction</h3>

                      <p>
                        Predicts a hazard category from your description.
                        This result is separate from response priority and team assignment.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="gemini-review-button"
                    onClick={requestNlpClassification}
                    disabled={!hasDescription || isNlpLoading}
                    aria-busy={isNlpLoading}
                  >
                    {isNlpLoading ? (
                      <>
                        <span
                          className="gemini-review-spinner"
                          aria-hidden="true"
                        />
                        Classifying
                      </>
                    ) : (
                      <>
                        <span>Classify hazard</span>
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M4 10h11m-4-4 4 4-4 4" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {nlpError && (
                  <p className="gemini-review-error" role="alert">
                    {nlpError}
                  </p>
                )}

                {nlpResult && (
                  <div className="gemini-review-result" aria-live="polite">
                    <p>
                      <strong>Predicted category:</strong>{' '}
                      {nlpResult.predicted_category.replace(/_/g, ' ')}
                    </p>
                    <p>
                      <strong>Model confidence:</strong>{' '}
                      {(nlpResult.confidence * 100).toFixed(1)}%
                    </p>
                    <p>
                      <strong>Model version:</strong>{' '}
                      {nlpResult.model_version || 'Unknown'}
                    </p>
                    <small>
                      This is a model prediction, not a confirmed diagnosis of the hazard.
                      Staff must review the report. Do not delay emergency action while
                      waiting for classification.
                    </small>
                  </div>
                )}
              </section>
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
