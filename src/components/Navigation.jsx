import React from 'react';
import './theme.css';
import './Navigation.css';

const TABS = [
  { id: 'dashboard', label: 'Safety Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'report', label: 'Report Portal', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { id: 'map', label: 'Evacuation Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { id: 'flood', label: 'Flood Resilience', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
];

export default function Navigation({ activeTab, onSelectTab, currentUser, onOpenLogin, onLogout }) {
  return (
    <div className="as-nav">
      <div className="as-nav__inner">
        {/* Brand */}
        <button
          type="button"
          className="as-nav__brand"
          onClick={() => onSelectTab(currentUser?.role === 'Executive' ? 'dashboard' : 'report')}
          aria-label="ARC-SHIELD, go to dashboard"
        >
          <span className="as-nav__logo" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <span className="as-nav__brand-name">ARC-SHIELD</span>
          <span className="as-nav__brand-ver">OS 2.4</span>
        </button>

        {/* Primary links */}
        <nav className="as-nav__links" aria-label="Main navigation">
          {TABS.filter((tab) => currentUser?.role === 'Executive' ? tab.id !== 'report' : tab.id !== 'dashboard').map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className="as-nav__link"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectTab(tab.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={tab.icon} />
                </svg>
                <span>{tab.id === 'dashboard' ? 'Incident Dashboard' : tab.id === 'report' ? 'Submit a Report' : tab.id === 'map' ? 'Evacuation Route' : tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Account */}
        <div className="as-nav__account">
          {currentUser ? (
            <div className="as-user">
              <span className="as-user__avatar" aria-hidden="true">{currentUser.avatar}</span>
              <span className="as-user__meta">
                <span className="as-user__name">{currentUser.name}</span>
                <span className="as-user__role">{currentUser.role}</span>
              </span>
              <button
                type="button"
                className="as-btn as-btn--secondary as-btn--sm"
                onClick={onOpenLogin}
                title="Switch dashboard access"
              >
                Switch dashboard
              </button>
              {onLogout && (
                <button type="button" className="as-btn as-btn--secondary as-btn--sm" onClick={onLogout}>
                  Sign out
                </button>
              )}
            </div>
          ) : (
            <button type="button" className="as-btn as-btn--primary as-btn--sm" onClick={onOpenLogin}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Operator Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
