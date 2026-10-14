export const initialIncidents = [
  { id: 'TKT-001', location: 'Lobby A', desc: 'Blocked exit route', risk: 'High', status: 'Reported', time: Date.now() - 1000 * 60 * 10 },
  { id: 'TKT-002', location: 'Basement 2', desc: 'Water pooling', risk: 'Moderate', status: 'Assigned', time: Date.now() - 1000 * 60 * 60 },
  { id: 'TKT-003', location: 'Server Room', desc: 'Smoke detected', risk: 'Critical', status: 'Reported', time: Date.now() - 1000 * 60 * 2 },
  { id: 'TKT-004', location: 'Level 3 Hallway', desc: 'Flickering light', risk: 'Low', status: 'Resolved', time: Date.now() - 1000 * 60 * 60 * 5 },
];