import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Disclaimer from './components/Disclaimer';
import ReportPortal from './views/ReportPortal';
import SafetyDashboard from './views/SafetyDashboard';
import EvacuationMap from './views/EvacuationMap';
import FloodResilience from './views/FloodResilience';

export default function App() {
  const [activeTab, setActiveTab] = useState('report');
  const [incidents, setIncidents] = useState([]);

  return (
    <div className="app-shell">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="app-main">
        {activeTab === 'report' && <ReportPortal onSubmit={(incident) => setIncidents((items) => [incident, ...items])} />}
        {activeTab === 'dashboard' && <SafetyDashboard newIncidents={incidents} />}
        {activeTab === 'evacuation' && <EvacuationMap />}
        {activeTab === 'flood' && <FloodResilience />}
      </main>
      <Disclaimer />
    </div>
  );
}
