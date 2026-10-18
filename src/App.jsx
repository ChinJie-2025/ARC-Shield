import React, { useState } from 'react';
import Navigation from './components/Navigation';
import SafetyDashboard from './views/SafetyDashboard';
import ReportPortal from './views/ReportPortal';
import EvacuationMap from './views/EvacuationMap';
import FloodResilience from './views/FloodResilience';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [submittedReports, setSubmittedReports] = useState([]);

  const handleReportSubmit = (newReport) => {
    setSubmittedReports((prev) => [newReport, ...prev]);
  };

  return (
    <div className="app-shell">
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />
      <main className="app-content">
        {activeTab === 'dashboard' && <SafetyDashboard newIncidents={submittedReports} />}
        {activeTab === 'report' && <ReportPortal onSubmit={handleReportSubmit} />}
        {activeTab === 'map' && <EvacuationMap />}
        {activeTab === 'flood' && <FloodResilience />}
      </main>
    </div>
  );
}