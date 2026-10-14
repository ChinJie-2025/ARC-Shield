import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Disclaimer from './components/Disclaimer';
import ReportPortal from './views/ReportPortal';
import SafetyDashboard from './views/SafetyDashboard';
import EvacuationMap from './views/EvacuationMap';
import FloodResilience from './views/FloodResilience';

export default function App() {
  const [activeTab, setActiveTab] = useState('report');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-grow p-4 md:p-6 overflow-auto">
        {activeTab === 'report' && <ReportPortal />}
        {activeTab === 'dashboard' && <SafetyDashboard />}
        {activeTab === 'evacuation' && <EvacuationMap />}
        {activeTab === 'flood' && <FloodResilience />}
      </main>

      <Disclaimer />
    </div>
  );
}