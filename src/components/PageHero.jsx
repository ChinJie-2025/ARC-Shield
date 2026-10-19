import React from 'react';
import './PageHero.css';

export default function PageHero({ tag, title, titleAccent, lead, badge, bgImage }) {
  return (
    <div className="page-hero-backdrop-container">
      <div className="page-hero-img-shell">
        <img src={bgImage} alt={title} className="page-hero-backdrop-photo" />
        <div className="page-hero-scrim-layer" />
      </div>

      <div className="page-hero-content-anchor">
        <div className="page-hero-frosted-card">
          <div className="page-hero-tags">
            <span className="page-hero-kicker">
              <span className="page-hero-pip" />
              {tag}
            </span>
            {badge && <span className="page-hero-badge-pill">{badge}</span>}
          </div>

          <h1 className="page-hero-headline">
            {title} {titleAccent && <span>{titleAccent}</span>}
          </h1>

          <p className="page-hero-summary">{lead}</p>
        </div>
      </div>
    </div>
  );
}