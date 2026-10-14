import React, { useState } from 'react';

export default function EvacuationMap() {
  const [mainExitBlocked, setMainExitBlocked] = useState(false);
  const [wheelchairMode, setWheelchairMode] = useState(false);

  // Determine active route instructions
  let routeStatus = "Proceed to Main Exit (Stairwell A).";
  let routeColor = "bg-green-100 border-green-400 text-green-800";

  if (mainExitBlocked && wheelchairMode) {
    routeStatus = "Main Exit BLOCKED. Proceed to Cargo Lift (Emergency Power Active).";
    routeColor = "bg-purple-100 border-purple-400 text-purple-800";
  } else if (mainExitBlocked) {
    routeStatus = "Main Exit BLOCKED. Rerouting to Secondary Exit (Stairwell B).";
    routeColor = "bg-orange-100 border-orange-400 text-orange-800";
  } else if (wheelchairMode) {
    routeStatus = "Accessible Route: Proceed to Evacuation Lift A.";
    routeColor = "bg-blue-100 border-blue-400 text-blue-800";
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Dynamic Evacuation Simulation</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-slate-100">
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-2 rounded border hover:bg-slate-100">
            <input 
              type="checkbox" 
              checked={mainExitBlocked} 
              onChange={(e) => setMainExitBlocked(e.target.checked)}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
            />
            <span className="font-medium text-slate-700">Simulate Main Exit Blocked</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-2 rounded border hover:bg-slate-100">
            <input 
              type="checkbox" 
              checked={wheelchairMode} 
              onChange={(e) => setWheelchairMode(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Wheelchair Accessible Route</span>
          </label>
        </div>

        <div className={`p-4 rounded-md border-l-4 font-bold mb-6 ${routeColor}`}>
          {routeStatus}
        </div>

        {/* Simulated Map Area */}
        <div className="relative w-full h-64 bg-slate-100 border-2 border-slate-300 rounded flex items-center justify-center overflow-hidden">
          <p className="absolute top-4 left-4 font-bold text-slate-400">Current Location</p>
          
          {/* Main Exit Node */}
          <div className={`absolute top-4 right-4 p-2 rounded text-sm font-bold border-2 ${mainExitBlocked ? 'bg-red-200 border-red-500 text-red-700' : 'bg-green-200 border-green-500 text-green-700'}`}>
            Main Exit (Stairs)
            {mainExitBlocked && <span className="block text-xs mt-1">❌ BLOCKED</span>}
          </div>

          {/* Secondary Exit Node */}
          <div className="absolute bottom-4 right-4 p-2 rounded text-sm font-bold border-2 bg-green-200 border-green-500 text-green-700">
            Secondary Exit
          </div>

          {/* Accessible Exit Node */}
          <div className="absolute bottom-4 left-4 p-2 rounded text-sm font-bold border-2 bg-blue-200 border-blue-500 text-blue-700">
            Evacuation Lift
          </div>

          {/* Center decorative element indicating it's a map */}
          <div className="text-slate-300 text-6xl">🗺️</div>
        </div>
      </div>
    </div>
  );
}