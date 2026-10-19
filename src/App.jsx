import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeHero from './components/HomeHero';
import PageHero from './components/PageHero';
import LoginModal from './components/LoginModal';
import SafetyDashboard from './views/SafetyDashboard';
import ReportPortal from './views/ReportPortal';
import EvacuationMap from './views/EvacuationMap';
import FloodResilience from './views/FloodResilience';
import { initialIncidents } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Authenticated user session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('arc_shield_user');
      return savedUser
        ? JSON.parse(savedUser)
        : {
            role: 'Property Staff',
            name: 'Officer Alex Tan',
            id: 'STAFF-8841',
            avatar: 'AT',
          };
    } catch {
      return {
        role: 'Property Staff',
        name: 'Officer Alex Tan',
        id: 'STAFF-8841',
        avatar: 'AT',
      };
    }
  });

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
      console.error(err);
    }
  }, [incidents]);

  const handleLoginSuccess = (userSession) => {
    setCurrentUser(userSession);
    try {
      localStorage.setItem('arc_shield_user', JSON.stringify(userSession));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportSubmit = (newReport) => {
    setIncidents((prev) => [newReport, ...prev]);
    setActiveTab('dashboard');
  };

  const handleCriticalFloodBreach = () => {
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
      {/* Floating Pill Nav with Active Authenticated User Badge */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Role Authentication Gateway Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <main className="app-content">
        {activeTab === 'dashboard' && (
          <>
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
                currentRole={currentUser.role}
              />
            </div>
          </>
        )}

        {activeTab === 'report' && (
          <>
            <PageHero
              tag="INCIDENT INTAKE CONSOLE"
              badge="DIRECT OPERATOR LINK"
              title="Environmental Hazard &amp;"
              titleAccent="Incident Intake"
              lead="Report visible infrastructure damages, water leaks, electrical sparking, or corridor obstructions for real-time AI triage."
              bgImage="https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=2000&q=80"
            />
            <ReportPortal onSubmit={handleReportSubmit} />
          </>
        )}

        {activeTab === 'map' && (
          <>
            <PageHero
              tag="AUTONOMOUS WAYFINDING"
              badge="DIJKSTRA VECTOR SOLVER"
              title="Dynamic Spatial Egress &amp;"
              titleAccent="Evacuation Vectors"
              lead="Interactive building BIM floorplan dynamically rerouting escape vectors around blocked stairwells, smoke zones, and accessible lifts."
              bgImage="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80"
            />
            <EvacuationMap activeHazards={activeHazards} />
          </>
        )}

        {activeTab === 'flood' && (
          <>
            <PageHero
              tag="HYDROLOGICAL TELEMETRY"
              badge="SCADA NODE #04"
              title="Predictive Runoff &amp;"
              titleAccent="Flood Defense Engine"
              lead="Real-time drainage modeling, retention basin level monitoring, and automated sluice barrier deployment thresholds."
              bgImage="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2000&q=80"
            />
            <FloodResilience onCriticalSurge={handleCriticalFloodBreach} />
          </>
        )}
      </main>
    </div>
  );
}