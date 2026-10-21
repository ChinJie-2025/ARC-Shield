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
import { apiUrl } from './lib/api';

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Authenticated user session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('arc_shield_user');
      return savedUser
        ? (() => { const user = JSON.parse(savedUser); return { ...user, role: ['Executive', 'Staff'].includes(user.role) ? user.role : 'Resident/Visitor' }; })()
        : {
            role: 'Resident/Visitor',
            name: 'Resident/Visitor User',
            id: 'RES-1001',
            avatar: 'RU',
          };
    } catch {
      return {
        role: 'Resident/Visitor',
        name: 'Resident/Visitor User',
        id: 'RES-1001',
        avatar: 'RU',
      };
    }
  });

  const [activeTab, setActiveTab] = useState(() => ['Executive', 'Staff'].includes(currentUser.role) ? 'dashboard' : 'report');

  const [incidents, setIncidents] = useState(() => {
    try {
      const saved = localStorage.getItem('arc_shield_incidents');
      return saved ? JSON.parse(saved) : initialIncidents;
    } catch {
      return initialIncidents;
    }
  });

  const [apiStatus, setApiStatus] = useState('checking');
  const [tierSummary, setTierSummary] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(apiUrl('/api/incidents'))
      .then((response) => {
        if (!response.ok) throw new Error('Incident service unavailable');
        return response.json();
      })
      .then((data) => {
        if (!active || !Array.isArray(data.incidents)) return;
        if (data.incidents.length > 0) {
          setIncidents(data.incidents);
        } else {
          fetch(apiUrl('/api/incidents'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ incidents }),
          }).catch(() => active && setApiStatus('offline'));
        }
        setApiStatus('connected');
      })
      .catch(() => active && setApiStatus('offline'));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('arc_shield_incidents', JSON.stringify(incidents));
      if (apiStatus === 'connected') {
        fetch(apiUrl('/api/incidents'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidents }),
        }).catch(() => setApiStatus('offline'));
      }
    } catch (err) {
      console.error(err);
    }
  }, [incidents, apiStatus]);

  const handleLoginSuccess = (userSession) => {
    setCurrentUser(userSession);
    setActiveTab(['Executive', 'Staff'].includes(userSession.role) ? 'dashboard' : 'report');
    try {
      localStorage.setItem('arc_shield_user', JSON.stringify(userSession));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportSubmit = (newReport) => {
    const reportWithReporter = { ...newReport, reporter: currentUser.name || 'Resident' };
    const nextIncidents = [reportWithReporter, ...incidents];
    setIncidents(nextIncidents);
    const signature = JSON.stringify(nextIncidents.map(({ id, desc, location, risk, reporter }) => ({ id, desc, location, risk, reporter })));
    fetch(apiUrl('/api/tier-summary'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ incidents: nextIncidents }) })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setTierSummary({ ...data, signature }); })
      .catch(() => setTierSummary({ error: 'Summary unavailable', signature }));
    setActiveTab('map');
  };

  const handleNavigate = (tab) => {
    const allowed = ['Executive', 'Staff'].includes(currentUser.role)
      ? ['dashboard', 'map', 'flood']
      : ['report', 'map', 'flood'];
    if (allowed.includes(tab)) setActiveTab(tab);
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
          escalateMinutes: 5,
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
        onSelectTab={handleNavigate}
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
        {activeTab === 'dashboard' && ['Executive', 'Staff'].includes(currentUser.role) && (
          <>
            <HomeHero
              activeIncidentCount={activeHazards.length}
              onReportIncident={undefined}
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
                tierSummary={tierSummary}
                onTierSummaryChange={setTierSummary}
              />
            </div>
          </>
        )}

        {activeTab === 'report' && !['Executive', 'Staff'].includes(currentUser.role) && (
          <>
            <HomeHero
              activeIncidentCount={activeHazards.length}
              residentView
              residentLabel="Resident/Visitor"
              onReportIncident={() => document.getElementById('resident-report-anchor')?.scrollIntoView({ behavior: 'smooth' })}
              onExplore={() => handleNavigate('map')}
            />
            <div id="resident-report-anchor"><ReportPortal onSubmit={handleReportSubmit} /></div>
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
