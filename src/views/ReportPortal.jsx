import React, { useState } from 'react';

export default function ReportPortal() {
  const [status, setStatus] = useState('idle'); // idle, submitting, success

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('submitting');
    // Simulate network request
    setTimeout(() => {
      setStatus('success');
    }, 1200);
  };

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h2 className="text-xl font-bold text-green-800 mb-2">Report Submitted</h2>
        <p className="text-green-700 font-medium">Please follow official emergency instructions if in immediate danger.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="mt-6 text-sm text-green-800 underline hover:text-green-900"
        >
          Submit another report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold mb-6 text-blue-900 border-b pb-2">Report a Hazard</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700">Photo Evidence</label>
          <div className="border-2 border-dashed border-slate-300 rounded p-4 text-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm text-slate-500">Tap to take photo or upload</span>
            <input type="file" className="hidden" accept="image/*" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700">Location</label>
          <input 
            type="text" 
            required
            placeholder="e.g. Block A Basement Parking" 
            className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700">Description of Hazard</label>
          <textarea 
            required
            placeholder="Describe what you see..." 
            className="w-full border border-slate-300 rounded p-2 h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={status === 'submitting'}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors disabled:opacity-70"
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}