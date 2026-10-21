import React from 'react';
import './theme.css';
import './HomeHero.css';

const CAPABILITIES = [
  'Multi-sensor telemetry',
  'Dynamic floor egress rerouting',
  'Predictive flood surge defense',
];

export default function HomeHero({ onExplore, onReportIncident, activeIncidentCount = 0, residentView = false, residentLabel = 'Resident/Visitor' }) {
  const hasHazards = activeIncidentCount > 0;

  return (
    <section className="as-hero" aria-labelledby="home-hero-title">
      <div className="as-hero__media" aria-hidden="true">
        <img
          className="as-hero__img"
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80"
          alt=""
        />
        <div className="as-hero__scrim" />
      </div>

      <div className="as-hero__inner">
        <div className="as-hero__copy">
          <p className="as-hero__eyebrow">Smart Facility Infrastructure</p>

          <h1 id="home-hero-title" className="as-hero__title">
            Enterprise Life-Safety &amp;
            <span>Hazard Autonomous Operations</span>
          </h1>

          <p className="as-hero__lead">
            {residentView
              ? `As a ${residentLabel}, view facility status, find a clear route across every level, and report hazards that need attention.`
              : 'Real-time multi-sensor telemetry, dynamic floor egress rerouting, and predictive hydrological surge defense deployed across corporate asset portfolios.'}
          </p>

          <div className="as-hero__cta">
            {onReportIncident && <button type="button" className="as-btn as-btn--light as-btn--lg" onClick={onReportIncident}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Report an Incident</span>
            </button>}

            <button type="button" className="as-btn as-btn--outline-light as-btn--lg" onClick={onExplore}>
              <span>{residentView ? 'View evacuation route' : 'Launch Command Console'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <ul className="as-hero__features">
            {CAPABILITIES.map((item) => (
              <li key={item}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="as-hero__status" aria-label="Current facility status">
          <div className="as-status">
            <span className="as-status__label">Facility status</span>
            <div className="as-status__value">{String(activeIncidentCount).padStart(2, '0')}</div>
            <div className="as-status__caption">
              {activeIncidentCount === 1 ? 'Active hazard monitored' : 'Active hazards monitored'}
            </div>
            <div className={`as-status__state ${hasHazards ? 'is-alert' : 'is-secure'}`}>
              <span className="as-status__dot" aria-hidden="true" />
              {hasHazards ? 'Monitoring in progress' : 'Perimeter secure'}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
