import React, { useState } from 'react';
import { classifyIncident } from '../data/incidentTriage';

export default function ReportPortal({ onSubmit = () => {} }) {
  const [status, setStatus] = useState('idle');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState('');
  const triage = classifyIncident(description);

  const handleSubmit = (event) => {
    event.preventDefault();
    const riskProfile = classifyIncident(description);
    onSubmit({ id: `ARC-${Date.now().toString().slice(-6)}`, location, desc: description, risk: riskProfile.risk, riskProfile, status: 'Reported', time: Date.now(), image: preview, reporter: 'Resident' });
    setStatus('success');
  };

  if (status === 'success') return <section className="success-card">
    <span className="success-mark">OK</span><p className="eyebrow">ARC-SHIELD / REPORTING PORTAL</p>
    <h1>Report submitted</h1><p className="success-copy">Please follow official emergency instructions if in immediate danger.</p>
    <p className="ticket-note">Your report has been prioritized for staff review.</p>
    <button className="button button-secondary" onClick={() => { setStatus('idle'); setPreview(''); setDescription(''); setLocation(''); }}>Submit another report</button>
  </section>;

  return <div className="report-layout">
    <section className="report-intro"><p className="eyebrow">SIME DARBY PROPERTY / SAFETY</p><h1>See a hazard?<br /><span>Tell us right away.</span></h1><p>Help our property team respond quickly. Share where the issue is and what you see.</p>
      <div className="emergency-note"><strong>Immediate danger?</strong><span>Move to safety and contact local emergency services. This form is not monitored as an emergency service.</span></div>
      <div className="response-promise"><span className="promise-icon">i</span><span><strong>AI-assisted triage</strong><small>Risk and response teams are suggested for staff review.</small></span></div>
    </section>
    <section className="form-card"><div className="form-heading"><span className="step-label">HAZARD REPORT</span><span className="required-note">* Required</span></div>
      <form onSubmit={handleSubmit} className="report-form">
        <label className="field-label">Photo <span className="optional">Optional</span>
          <span className="upload-box">{preview ? <img className="upload-preview" src={preview} alt="Selected hazard" /> : <span className="upload-content"><span className="upload-icon">+</span><strong>Add a photo</strong><small>Tap to take a photo or choose a file</small></span>}
            <input type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)); }} />
          </span>
        </label>
        <label className="field-label">Location <span className="required-star">*</span><input required value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Block A, basement car park" /></label>
        <label className="field-label">What did you notice? <span className="required-star">*</span><textarea required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the hazard and any immediate concerns..." rows="4" /></label>
        <div className={`triage-preview risk-${triage.risk.toLowerCase()}`}><div className="triage-preview-head"><span>AI-ASSISTED REVIEW PRIORITY</span><strong>{description.trim() ? triage.risk.toUpperCase() : 'AWAITING DETAILS'}</strong></div><p>{description.trim() ? triage.reason : 'Add a description to receive a suggested risk category.'}</p>{description.trim() && <><p><b>Suggested teams:</b> {triage.teams.join(', ')}</p><p><b>Response target:</b> {triage.sla}</p></>}</div>
        <p className="classification-note">Automated suggestions can be incorrect. Staff review and confirm every report.</p>
        <button className="button button-primary submit-button" type="submit">Submit report <span>&gt;</span></button>
        <p className="privacy-note">Your report is shared with the property response team.</p>
      </form>
    </section>
  </div>;
}
