import React from 'react';
import './HomeHero.css';

export default function HomeHero({ onExplore, onReportIncident, activeIncidentCount = 0 }) {
  return (
    <section className="official-hero-container">
      {/* 50vh High-Resolution Cinematic Backdrop */}
      <div className="hero-media-wrapper">
        <img
          className="hero-backdrop-img"
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80"
          alt="Modern Architectural Infrastructure Safety Core"
        />
        <div className="hero-ambient-scrim" />
      </div>

      {/* Floating Glass Content Plate */}
      <div className="hero-content-anchor">
        <div className="hero-glass-plate">
          <div className="hero-top-cluster">
            <span className="hero-status-pill">
              <span className="hero-pulse-dot" />
              SMART FACILITY INFRASTRUCTURE MATRIX
            </span>
            <span className="hero-metric-chip">
              {activeIncidentCount > 0 ? `${activeIncidentCount} ACTIVE HAZARDS MONITORED` : 'PERIMETER SECURE'}
            </span>
          </div>

          <h1 className="hero-core-title">
            Enterprise Life-Safety &amp; <br />
            <span>Hazard Autonomous Operations</span>
          </h1>

          <p className="hero-core-lead">
            Real-time multi-sensor telemetry, dynamic floor egress rerouting, and predictive hydrological surge defense deployed across corporate asset portfolios.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={onReportIncident}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>Report An Incident</span>
            </button>

            <button
              type="button"
              className="btn-hero-glass"
              onClick={onExplore}
            >
              <span>Launch Command Console</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}