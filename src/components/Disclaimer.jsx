import React from 'react';
import './theme.css';
import './Disclaimer.css';

export default function Disclaimer() {
  return (
    <footer className="as-footer">
      <div className="as-footer__inner">
        <div className="as-footer__brand">
          <span className="as-footer__logo" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <span className="as-footer__name">ARC-SHIELD</span>
        </div>

        <p className="as-footer__disclaimer">
          <strong>Disclaimer.</strong> Prototype for demonstration only. Does not replace official fire-safety systems or guarantee flood predictions.
        </p>

        <p className="as-footer__copy">&copy; {new Date().getFullYear()} ARC-SHIELD OS</p>
      </div>
    </footer>
  );
}
