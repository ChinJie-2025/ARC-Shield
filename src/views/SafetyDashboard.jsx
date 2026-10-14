import React, { useState, useEffect } from 'react';
import { initialIncidents } from '../data/mockData';

export default function SafetyDashboard() {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [verifyModal, setVerifyModal] = useState(null);
  const [evidenceMsg, setEvidenceMsg] = useState("");

  const handleVerify = (incident) => {
    setVerifyModal(incident);
  };

  const submitVerification = () => {
    setIncidents(incidents.map(inc => 
      inc.id === verifyModal.id ? { ...inc, status: 'Resolved', evidence: evidenceMsg } : inc
    ));
    setVerifyModal(null);
    setEvidenceMsg("");
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Moderate': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Safety Intelligence Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Reported', 'Assigned', 'Responded', 'Resolved'].map(status => (
          <div key={status} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">{status}</h3>
            <div className="space-y-3">
              {incidents.filter(i => i.status === status).map(incident => (
                <div key={incident.id} className={`p-3 rounded border ${getRiskColor(incident.risk)}`}>
                  <div className="flex justify-between font-bold text-sm">
                    <span>{incident.id}</span>
                    <span>{incident.risk}</span>
                  </div>
                  <p className="text-sm mt-1">{incident.location}</p>
                  <p className="text-xs mt-1 opacity-80">{incident.desc}</p>
                  
                  {status !== 'Resolved' && (
                    <button 
                      onClick={() => handleVerify(incident)}
                      className="mt-3 w-full bg-white bg-opacity-50 hover:bg-opacity-100 text-sm py-1 rounded transition-colors border border-current"
                    >
                      Verify & Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {verifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Verify Resolution: {verifyModal.id}</h3>
            <textarea 
              className="w-full border rounded p-2 mb-4 h-24" 
              placeholder="Enter resolution notes/evidence..."
              value={evidenceMsg}
              onChange={(e) => setEvidenceMsg(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setVerifyModal(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button 
                onClick={submitVerification}
                disabled={!evidenceMsg.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Close Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}