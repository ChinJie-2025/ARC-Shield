import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeHero from './components/HomeHero';
import SafetyDashboard from './views/SafetyDashboard';
import ReportPortal from './views/ReportPortal';
import EvacuationMap from './views/EvacuationMap';
import FloodResilience from './views/FloodResilience';
import { initialIncidents } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [incidents, setIncidents] = useState(() => {
    try {
      const saved = localStorage.getItem('arc_shield_incidents');
      return saved ? JSON.parse(saved) : initialIncidents;
    } catch {
      return initialIncidents;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('arc_shield_incidents', JSON.stringify(incidents));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }, [incidents]);

  const handleReportSubmit = (newReport) => {
    setIncidents((prev) => [newReport, ...prev]);
    setActiveTab('dashboard'); // Switch to dashboard to view the new ticket
  };

  const handleCriticalFloodBreach = (floodAlert) => {
    const existing = incidents.find((i) => i.id === 'FLOOD-AUTO-CRITICAL');
    if (!existing) {
      const floodIncident = {
        id: 'FLOOD-AUTO-CRITICAL',
        desc: 'Automated Stormwater Overflow Trigger: Retention Basin Capacity Breached',
        location: 'Basin Retention Pond & Lower Culvert Headwall',
        risk: 'Critical',
        riskProfile: {
          priority: 1,
          interveneMinutes: 5,
          escalateMinutes: 10,
          sla: 'Immediate 5 min intervention',
          teams: ['Hydraulic Engineering', 'Perimeter Flood Response'],
        },
        status: 'Reported',
        time: Date.now(),
        image: '',
        reporter: 'SCADA Hydrological Sensor Array',
      };
      setIncidents((prev) => [floodIncident, ...prev]);
    }
  };

  const activeHazards = incidents
    .filter((i) => i.status !== 'Resolved' && ['High', 'Critical'].includes(i.risk))
    .map((i) => ({
      id: i.id,
      desc: i.desc,
      location: i.location,
      risk: i.risk,
    }));

  return (
    <div className="app-shell">
      {/* Floating Frosted Pill Nav Bar remains suspended at top */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="app-content">
        {activeTab === 'dashboard' && (
          <>
            {/* 50vh Cinematic Enterprise Hero Backdrop */}
            <HomeHero
              activeIncidentCount={activeHazards.length}
              onReportIncident={() => setActiveTab('report')}
              onExplore={() => {
                const el = document.getElementById('board-section-anchor');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            <div id="board-section-anchor">
              <SafetyDashboard
                incidents={incidents}
                setIncidents={setIncidents}
              />
            </div>
          </>
        )}

        {activeTab === 'report' && (
          <ReportPortal onSubmit={handleReportSubmit} />
        )}

        {activeTab === 'map' && (
          <EvacuationMap activeHazards={activeHazards} />
        )}

        {activeTab === 'flood' && (
          <FloodResilience onCriticalSurge={handleCriticalFloodBreach} />
        )}
      </main>
    </div>
  );
}