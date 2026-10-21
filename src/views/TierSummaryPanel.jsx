import React, { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';

export default function TierSummaryPanel({ incidents, tierSummary, onTierSummaryChange }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const signature = JSON.stringify(incidents.map(({ id, desc, location, risk, reporter }) => ({ id, desc, location, risk, reporter })));

  useEffect(() => {
    const controller = new AbortController();
    const reports = JSON.parse(signature);
    if (!reports.length) { setSummary({ summaries: [], aiAvailable: true }); setError(''); return () => controller.abort(); }
    if (tierSummary?.signature === signature && !tierSummary.error) {
      setSummary(tierSummary); setError(tierSummary.error || ''); setLoading(false);
      return () => controller.abort();
    }
    setLoading(true); setError('');
    fetch(apiUrl('/api/tier-summary'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidents: reports }), signal: controller.signal,
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Summary unavailable');
      const result = { ...data, signature };
      setSummary(result); onTierSummaryChange?.(result);
    }).catch((requestError) => {
      if (requestError.name !== 'AbortError') setError(requestError.message || 'Summary unavailable');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [signature, tierSummary, onTierSummaryChange]);

  return <section className="tier-summary-panel" aria-live="polite">
    <div className="tier-summary-heading"><div><span className="kicker-tag">AI REPORT BRIEFING</span><h2>Reports grouped by priority</h2></div><span className="tier-summary-state">{loading ? 'Summarizing…' : summary?.aiAvailable ? 'Gemini summary' : 'Count overview'}</span></div>
    {error ? <p className="tier-summary-message">{error}. Tier grouping remains available below.</p>
      : summary?.summaries?.length ? <div className="tier-summary-grid">{summary.summaries.map((item) => <article className={`tier-summary-item tier-${item.tier.toLowerCase()}`} key={item.tier}><div><strong>{item.tier}</strong><span>{item.count} report{item.count === 1 ? '' : 's'}</span></div><p>{item.summary}</p></article>)}</div>
        : <p className="tier-summary-message">No reports to summarize yet.</p>}
    {summary && !summary.aiAvailable && <small>Gemini is not configured; showing report counts by tier.</small>}
  </section>;
}

