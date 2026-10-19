import React from 'react';
import './theme.css';
import './PageHero.css';

export default function PageHero({ tag, title, titleAccent, lead, badge, bgImage }) {
  return (
    <section className="as-page-hero">
      <div className="as-page-hero__media" aria-hidden="true">
        {bgImage && <img src={bgImage} alt="" className="as-page-hero__img" />}
        <div className="as-page-hero__scrim" />
      </div>

      <div className="as-page-hero__inner">
        <div className="as-page-hero__tags">
          {tag && <span className="as-page-hero__kicker">{tag}</span>}
          {badge && <span className="as-page-hero__badge">{badge}</span>}
        </div>

        <h1 className="as-page-hero__title">
          {title}
          {titleAccent && (
            <>
              {' '}
              <span>{titleAccent}</span>
            </>
          )}
        </h1>

        {lead && <p className="as-page-hero__lead">{lead}</p>}
      </div>
    </section>
  );
}
