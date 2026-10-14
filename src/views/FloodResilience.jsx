import React, { useState } from 'react';

export default function FloodResilience() {
  const [waterLevel, setWaterLevel] = useState(45); // Percentage

  const isCritical = waterLevel >= 80;
  const isWarning = waterLevel >= 60 && waterLevel < 80;

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Flood Resilience & Monitoring</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Controls (For Hackathon Simulation) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 md:col-span-1">
          <h3 className="font-bold text-lg border-b pb-2 mb-4">Simulation Controls</h3>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Simulate Canal Water Level: {waterLevel}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={waterLevel}
            onChange={(e) => setWaterLevel(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="mt-4 flex justify-between text-xs text-slate-500">
            <span>Normal (0-59)</span>
            <span>Warning (60-79)</span>
            <span>Critical (80+)</span>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 md:col-span-2">
          <h3 className="font-bold text-lg border-b pb-2 mb-4">Preparedness Alerts</h3>
          
          <div className="space-y-4">
            {isCritical ? (
              <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-md">
                <div className="font-bold text-lg mb-1">🚨 CRITICAL FLOOD WARNING</div>
                <p>Water level at {waterLevel}%. Immediate Action Required:</p>
                <ul className="list-disc ml-5 mt-2 font-medium">
                  <li>Deploy all physical flood barriers immediately.</li>
                  <li>Activate main drainage pumps at maximum capacity.</li>
                  <li>Issue auto-alerts to basement parking tenants.</li>
                </ul>
              </div>
            ) : isWarning ? (
              <div className="p-4 bg-amber-100 border border-amber-300 text-amber-800 rounded-md">
                <div className="font-bold text-lg mb-1">⚠️ PREPAREDNESS ALERT</div>
                <p>Water level rising ({waterLevel}%). Standby protocols initiated:</p>
                <ul className="list-disc ml-5 mt-2 font-medium">
                  <li>Inspect primary flood barriers and seals.</li>
                  <li>Test backup generators for drainage pumps.</li>
                </ul>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-md">
                <div className="font-bold text-lg mb-1">✅ ALL CLEAR</div>
                <p>Water level is stable at {waterLevel}%. No immediate threats detected. Continue standard monitoring schedule.</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
             <div className="bg-slate-50 p-4 border rounded text-center">
               <p className="text-slate-500 text-sm">24hr Rainfall Forecast</p>
               <p className="text-2xl font-bold text-blue-900 mt-1">45 mm</p>
             </div>
             <div className="bg-slate-50 p-4 border rounded text-center">
               <p className="text-slate-500 text-sm">Pump Status</p>
               <p className={`text-2xl font-bold mt-1 ${isCritical ? 'text-green-600' : 'text-slate-700'}`}>
                 {isCritical ? 'ACTIVE' : 'STANDBY'}
               </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}