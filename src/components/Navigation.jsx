import React from 'react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'report', label: 'Report Hazard' },
    { id: 'dashboard', label: 'Safety Dashboard' },
    { id: 'evacuation', label: 'Evacuation Map' },
    { id: 'flood', label: 'Flood Resilience' },
  ];

  return (
    <nav className="bg-blue-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 font-bold text-xl tracking-wide">
            SDP Resilience
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}