import React, { useMemo } from 'react';

function issueKey(item) {
  const text = `${item.desc || ''}`.toLowerCase();
  const location = `${item.location || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const type = /fire|smoke|flame|burning|gas leak/.test(text) ? 'fire or smoke'
    : /water|flood|leak|pooling|drain/.test(text) ? 'water issue'
      : /exit|door|blocked|obstruction/.test(text) ? 'access obstruction'
        : /wire|electrical|spark|power/.test(text) ? 'electrical hazard'
          : /light|lighting/.test(text) ? 'lighting issue'
            : /crack|structural|ceiling|wall/.test(text) ? 'structural concern'
              : /lift|elevator/.test(text) ? 'lift issue'
                : text.replace(/[^a-z0-9]+/g, ' ').trim();
  return `${location}|${type}`;
}

export default function RepeatReportPanel({ incidents }) {
  const repeats = useMemo(() => {
    const groups = new Map();
    incidents.forEach((item) => {
      const key = issueKey(item);
      const entry = groups.get(key) || { key, issue: key.split('|')[1], location: item.location || 'Location not provided', reports: [], reporters: new Set() };
      entry.reports.push(item);
      entry.reporters.add(item.reporter || item.id);
      groups.set(key, entry);
    });
    return [...groups.values()].filter((group) => group.reports.length > 1).sort((a, b) => b.reports.length - a.reports.length).slice(0, 4);
  }, [incidents]);

  return <section className="repeat-report-panel">
    <div className="repeat-report-heading"><div><span className="kicker-tag">REPEAT ISSUE WATCH</span><h2>Reports about the same problem</h2></div><span>{repeats.length} repeated issue{repeats.length === 1 ? '' : 's'}</span></div>
    {repeats.length ? <div className="repeat-report-grid">{repeats.map((group) => <article key={group.key}><div><strong>{group.issue}</strong><span>{group.reports.length} reports</span></div><p>{group.location}</p><small>Reported by {group.reporters.size} resident{group.reporters.size === 1 ? '' : 's'}</small></article>)}</div> : <p className="repeat-report-empty">No repeated issues have been reported yet.</p>}
  </section>;
}
