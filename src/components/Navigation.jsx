import React from 'react';
import './Navigation.css';

export default function Navigation({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Safety Dashboard' },
    { id: 'report', label: 'Report Portal' },
    { id: 'map', label: 'Evacuation Map' },
    { id: 'flood', label: 'Flood Resilience' },
  ];

  return (
    <header className="ios-nav-outer">
      <div className="ios-nav-capsule">
        {/* Brand Lockup */}
        <div className="ios-brand-box">
          <div className="ios-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="ios-brand-text">
            <span className="brand-primary-name">ARC-SHIELD</span>
            <span className="brand-dot">•</span>
            <span className="brand-secondary-tag">SAFETY OS</span>
          </div>
        </div>

        {/* Segmented Controller Tab Bar */}
        <div className="ios-segmented-control" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`ios-segment-item ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Status indicator */}
        <div className="ios-system-badge">
          <span className="ios-badge-pulse" />
          <span>OPERATIONAL</span>
        </div>
      </div>
    </header>
  );
}