import React, { useEffect, useState } from 'react';
import { initialIncidents } from '../data/mockData';
import { classifyIncident } from '../data/incidentTriage';

const getProfile = (incident) => incident.riskProfile || classifyIncident(incident.desc);
const initials = (name = 'Unassigned') => name === 'Unassigned' ? '--' : name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const formatRemaining = (milliseconds) => {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function IncidentCard({ incident, onClaim, onRespond, onVerify, now }) {
  const profile = getProfile(incident);
  const deadline = incident.time + profile.interveneMinutes * 60000;
  const left = deadline - now;
  const overdue = left <= 0 && incident.status !== 'Responded' && incident.status !== 'Resolved';
  const escalationDue = profile.escalateMinutes ? incident.time + profile.escalateMinutes * 60000 : null;
  const escalated = escalationDue && now >= escalationDue && incident.status !== 'Responded' && incident.status !== 'Resolved';
  return <article className={`incident-card risk-${incident.risk.toLowerCase()}`}>
    <div className="incident-top"><span className={`risk-pill risk-pill-${incident.risk.toLowerCase()}`}><i />{incident.risk} / P{profile.priority}</span><span className="ticket-id">{incident.id}</span></div>
    <h3>{incident.desc}</h3><p className="incident-location">&#8226; {incident.location}</p>
    {incident.image && <img className="incident-photo" src={incident.image} alt="Resident submitted evidence" />}
    <div className="incident-meta"><span>Reported {new Date(incident.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span>Intervention SLA</span></div>
    <div className={`sla-clock ${overdue ? 'sla-overdue' : ''}`}><span>{incident.status === 'Responded' ? 'INTERVENTION RECORDED' : overdue ? 'OVERDUE' : 'TIME TO INTERVENE'}</span><strong>{incident.status === 'Responded' ? 'Responded' : overdue ? `Late ${formatRemaining(-left)}` : formatRemaining(left)}</strong></div>
    <div className="team-routing"><span>ROUTED TEAMS</span><p>{profile.teams.join(' / ')}</p></div>
    <div className="sla-detail">{profile.sla}</div>
    {escalationDue && <div className={`escalation-state ${escalated ? 'is-escalated' : ''}`}>{escalated ? 'ESCALATED TO C-LEVEL / EXECUTIVE' : `Executive escalation in ${formatRemaining(escalationDue - now)}`}</div>}
    <div className="assignee-row"><span className="avatar">{initials(incident.assignee)}</span><span>{incident.assignee || 'Unassigned'}</span></div>
    {incident.status === 'Reported' && <button className="card-action" onClick={() => onClaim(incident.id)}>Accept and claim <span>&gt;</span></button>}
    {incident.status === 'Assigned' && <button className="card-action" onClick={() => onRespond(incident.id)}>Record intervention / respond <span>&gt;</span></button>}
    {incident.status === 'Responded' && <button className="card-action" onClick={() => onVerify(incident)}>Verify resolution <span>&gt;</span></button>}
    {incident.status === 'Resolved' && <div className="resolved-note">Resolved{incident.evidence ? ` / ${incident.evidence}` : ''}</div>}
  </article>;
}

export default function SafetyDashboard({ newIncidents = [] }) {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [verifyModal, setVerifyModal] = useState(null);
  const [evidenceMsg, setEvidenceMsg] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState('');
  const [now, setNow] = useState(Date.now());
  const [role, setRole] = useState('Property Staff');
  useEffect(() => setIncidents((items) => [...newIncidents.filter((newItem) => !items.some((item) => item.id === newItem.id)), ...items]), [newIncidents]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);

  const claim = (id) => setIncidents((items) => items.map((item) => item.id === id ? { ...item, status: 'Assigned', assignee: 'You' } : item));
  const respond = (id) => setIncidents((items) => items.map((item) => item.id === id ? { ...item, status: 'Responded', respondedAt: Date.now() } : item));
  const submitVerification = (event) => {
    event.preventDefault();
    if (!evidenceMsg.trim() && !evidencePhoto) return;
    setIncidents((items) => items.map((item) => item.id === verifyModal.id ? { ...item, status: 'Resolved', evidence: evidenceMsg.trim() || 'Photo evidence uploaded', evidencePhoto } : item));
    setVerifyModal(null); setEvidenceMsg(''); setEvidencePhoto('');
  };
  const active = incidents.filter((item) => item.status !== 'Resolved');
  const escalated = active.filter((item) => { const profile = getProfile(item); return profile.escalateMinutes && now >= item.time + profile.escalateMinutes * 60000 && item.status !== 'Responded'; });
  return <div className="dashboard-wrap">
    <div className="dashboard-header"><div><p className="eyebrow">PROPERTY OPERATIONS / SAFETY</p><h1>Safety intelligence</h1><p>AI-assisted triage, responsible team routing and response deadlines.</p></div><div className="dashboard-tools"><span className="live-indicator"><i /> LIVE QUEUE</span><label className="role-select">Viewing as <select value={role} onChange={(event) => setRole(event.target.value)}><option>Property Staff</option><option>Executive</option></select></label></div></div>
    <div className="metric-strip"><div className="metric-tile"><span>Open incidents</span><strong>{active.length.toString().padStart(2, '0')}</strong><small>Across all risk levels</small></div><div className="metric-tile metric-high"><span>High / critical</span><strong>{active.filter((item) => ['High', 'Critical'].includes(item.risk)).length.toString().padStart(2, '0')}</strong><small>Priority response queue</small></div><div className="metric-tile metric-overdue"><span>Executive escalations</span><strong>{escalated.length.toString().padStart(2, '0')}</strong><small>{escalated.length ? 'Immediate follow-up required' : 'No overdue escalation thresholds'}</small></div><div className="metric-tile"><span>Resolved</span><strong>{incidents.filter((item) => item.status === 'Resolved').length.toString().padStart(2, '0')}</strong><small>With verification evidence</small></div></div>
    {escalated.length > 0 && <div className="escalation-banner"><span>!</span><div><strong>Executive escalation required</strong><small>{escalated.map((item) => `${item.id} (${item.risk})`).join(', ')} missed its intervention threshold without a response.</small></div><span className="escalation-tag">{role === 'Executive' ? 'EXECUTIVE VIEW' : 'ESCALATED'}</span></div>}
    <section className="incident-section"><div className="section-heading"><div><h2>Prioritized incident queue</h2><p>P1 items first. Claim, record intervention, then verify resolution with evidence.</p></div><span className="queue-count">{active.length} ACTIVE</span></div>
      <div className="incident-columns">{['Reported', 'Assigned', 'Responded', 'Resolved'].map((status) => <div className="incident-column" key={status}><div className="column-heading"><span>{status}</span><span className="column-count">{incidents.filter((item) => item.status === status).length}</span></div><div className="card-stack">{incidents.filter((item) => item.status === status).sort((a, b) => getProfile(a).priority - getProfile(b).priority || a.time - b.time).map((incident) => <IncidentCard key={incident.id} incident={incident} now={now} onClaim={claim} onRespond={respond} onVerify={setVerifyModal} />)}{incidents.filter((item) => item.status === status).length === 0 && <div className="empty-column">No {status.toLowerCase()} incidents</div>}</div></div>)}</div>
    </section>
    {verifyModal && <div className="modal-backdrop" role="presentation"><form className="verify-modal" onSubmit={submitVerification}><button type="button" className="modal-close" onClick={() => setVerifyModal(null)} aria-label="Close">x</button><p className="eyebrow">CASE CLOSURE</p><h2>Verify resolution</h2><p className="modal-context"><strong>{verifyModal.id}</strong> / {verifyModal.location}</p><label className="field-label">Resolution notes <span className="optional">Required if no photo</span><textarea value={evidenceMsg} onChange={(event) => setEvidenceMsg(event.target.value)} placeholder="Describe corrective action and what you verified..." rows="4" /></label><label className="field-label">Verification photo <span className="optional">Optional</span><input className="evidence-input" type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) setEvidencePhoto(URL.createObjectURL(file)); }} /></label>{evidencePhoto && <img className="evidence-preview" src={evidencePhoto} alt="Verification evidence" />}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setVerifyModal(null)}>Cancel</button><button className="button button-primary" type="submit" disabled={!evidenceMsg.trim() && !evidencePhoto}>Verify and close</button></div></form></div>}
  </div>;
}
