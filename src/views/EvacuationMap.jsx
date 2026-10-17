import React, { useState } from 'react';

const exits = {
  main: { label: 'Main Exit', sublabel: 'Stairwell A', x: 760, y: 270 },
  secondary: { label: 'Secondary Exit', sublabel: 'Stairwell B', x: 100, y: 270 },
  accessible: { label: 'Accessible Exit', sublabel: 'Evacuation Lift A', x: 450, y: 95 },
  cargo: { label: 'Assisted Exit', sublabel: 'Cargo Lift', x: 760, y: 95 },
};

export default function EvacuationMap() {
  const [mainExitBlocked, setMainExitBlocked] = useState(false);
  const [wheelchairMode, setWheelchairMode] = useState(false);
  const selectedExit = mainExitBlocked
    ? wheelchairMode ? 'cargo' : 'secondary'
    : wheelchairMode ? 'accessible' : 'main';
  const exit = exits[selectedExit];
  const routeColor = mainExitBlocked ? '#c66a32' : wheelchairMode ? '#267a9c' : '#27866d';
  const routePath = {
    main: 'M 450 420 L 450 270 L 760 270',
    secondary: 'M 450 420 L 450 270 L 100 270',
    accessible: 'M 450 420 L 450 95',
    cargo: 'M 450 420 L 450 270 L 650 270 L 650 95 L 760 95',
  }[selectedExit];
  const instructions = {
    main: ['Head north along the central corridor.', 'Turn right at the junction for Stairwell A.'],
    secondary: ['Main exit is marked blocked. Do not approach it.', 'Turn left at the central junction for Stairwell B.'],
    accessible: ['Follow the central corridor north.', 'Use Evacuation Lift A on the accessible route.'],
    cargo: ['Main exit is marked blocked. Do not approach it.', 'Follow the east corridor to the assisted evacuation lift.'],
  }[selectedExit];

  return <div className="evacuation-page">
    <header className="evacuation-header"><div><p className="eyebrow">PROPERTY OPERATIONS / ROUTE SIMULATION</p><h1>Evacuation route planner</h1><p>Illustrative floor plan with live route changes for blocked exits and accessible evacuation.</p></div><span className="map-demo-badge"><i /> SIMULATION</span></header>
    <section className="evacuation-controls"><div className="control-copy"><strong>Route conditions</strong><span>Toggle a condition to see the suggested path update.</span></div><label className={`route-toggle ${mainExitBlocked ? 'toggle-danger' : ''}`}><input type="checkbox" checked={mainExitBlocked} onChange={(event) => setMainExitBlocked(event.target.checked)} /><span className="toggle-track" /><span><b>Main exit blocked</b><small>Reroute away from Stairwell A</small></span></label><label className={`route-toggle ${wheelchairMode ? 'toggle-accessible' : ''}`}><input type="checkbox" checked={wheelchairMode} onChange={(event) => setWheelchairMode(event.target.checked)} /><span className="toggle-track" /><span><b>Accessible route</b><small>Use step-free evacuation path</small></span></label></section>
    <div className="evacuation-layout">
      <section className="floorplan-card"><div className="floorplan-top"><div><span className="floor-tag">LEVEL 01</span><h2>Site evacuation plan</h2></div><span className="floorplan-live"><i /> ROUTE UPDATED</span></div>
        <div className="floorplan-scroll"><svg className="floorplan-svg" viewBox="0 0 900 540" role="img" aria-labelledby="map-title map-description" preserveAspectRatio="xMidYMid meet">
          <title id="map-title">Simulated building evacuation route</title><desc id="map-description">Route from your current location to {exit.label}, {exit.sublabel}. Selected route is highlighted.</desc>
          <defs><pattern id="floor-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="#e7edf1" strokeWidth="1" /></pattern><filter id="route-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <rect x="0" y="0" width="900" height="540" fill="#f5f8fa"/><rect x="0" y="0" width="900" height="540" fill="url(#floor-grid)"/>
          <rect x="35" y="42" width="830" height="450" rx="18" fill="#fff" stroke="#cbd5df" strokeWidth="4"/>
          <rect x="70" y="78" width="175" height="112" rx="7" className="map-room"/><text x="157" y="128" textAnchor="middle" className="map-room-label">LOBBY</text><text x="157" y="149" textAnchor="middle" className="map-room-sub">Reception / waiting</text>
          <rect x="315" y="78" width="110" height="112" rx="7" className="map-room"/><text x="370" y="132" textAnchor="middle" className="map-room-label">OFFICE</text>
          <rect x="480" y="78" width="115" height="112" rx="7" className="map-room"/><text x="537" y="132" textAnchor="middle" className="map-room-label">MEETING</text>
          <rect x="675" y="345" width="150" height="105" rx="7" className="map-room"/><text x="750" y="395" textAnchor="middle" className="map-room-label">AMENITIES</text><text x="750" y="416" textAnchor="middle" className="map-room-sub">Common area</text>
          <rect x="75" y="345" width="150" height="105" rx="7" className="map-room"/><text x="150" y="395" textAnchor="middle" className="map-room-label">SERVICE</text><text x="150" y="416" textAnchor="middle" className="map-room-sub">Facilities</text>
          <path d="M245 195 V345 M315 195 V240 M425 195 V240 M480 195 V345 M595 195 V240 M675 195 V345" className="map-wall"/><path d="M245 345 H315 M425 345 H480 M595 345 H675 M245 195 H315 M425 195 H480 M595 195 H675" className="map-wall"/>
          <path d="M450 420 V270 M450 270 H760 M450 270 H100 M450 270 V95 M450 270 H650 V95 H760" className="map-corridor"/>
          <path d="M450 420 V270 M450 270 H760 M450 270 H100 M450 270 V95 M450 270 H650 V95 H760" className="map-route-guide"/>
                    <path d={routePath} className={`map-active-route ${wheelchairMode ? 'accessible-route' : ''}`} style={{ stroke: routeColor }} filter="url(#route-glow)" />
          {wheelchairMode && <g className="accessible-route-markers" aria-label="Step-free route markers"><path d="M450 332 L442 346 L458 346 Z M450 203 L442 217 L458 217 Z" fill="#fff" stroke="#267a9c" strokeWidth="2"/><circle cx="450" cy="355" r="12"/><text x="450" y="359" textAnchor="middle">1</text><circle cx="450" cy="235" r="12"/><text x="450" y="239" textAnchor="middle">2</text><rect x="482" y="287" width="112" height="25" rx="12"/><text x="538" y="304" textAnchor="middle" className="accessible-route-label">STEP-FREE</text><rect x="482" y="76" width="94" height="22" rx="11"/><text x="529" y="91" textAnchor="middle" className="accessible-route-label">LIFT ACCESS</text></g>}
          <circle cx="450" cy="420" r="18" className="you-pulse"/><circle cx="450" cy="420" r="8" className="you-dot"/><text x="450" y="462" textAnchor="middle" className="map-you-label">YOU ARE HERE</text>
          <circle cx="450" cy="270" r="9" className="map-junction"/><text x="450" y="249" textAnchor="middle" className="map-small-label">CENTRAL JUNCTION</text>
          <g className={selectedExit === 'main' ? 'exit-node selected-exit' : mainExitBlocked ? 'exit-node blocked-exit' : 'exit-node'}><circle cx="760" cy="270" r="17"/><text x="760" y="276" textAnchor="middle" className="exit-symbol">{mainExitBlocked ? 'X' : 'A'}</text><text x="760" y="310" textAnchor="middle" className="map-exit-label">STAIRWELL A</text>{mainExitBlocked && <text x="760" y="330" textAnchor="middle" className="map-blocked-label">BLOCKED</text>}</g>
          <g className={selectedExit === 'secondary' ? 'exit-node selected-exit' : 'exit-node'}><circle cx="100" cy="270" r="17"/><text x="100" y="276" textAnchor="middle" className="exit-symbol">B</text><text x="100" y="310" textAnchor="middle" className="map-exit-label">STAIRWELL B</text></g>
          <g className={selectedExit === 'accessible' ? 'exit-node selected-exit accessible-exit' : 'exit-node accessible-exit'}><circle cx="450" cy="95" r="17"/><text x="450" y="101" textAnchor="middle" className="exit-symbol">L</text><text x="450" y="68" textAnchor="middle" className="map-exit-label">EVACUATION LIFT A</text></g>
          <g className={selectedExit === 'cargo' ? 'exit-node selected-exit accessible-exit' : 'exit-node accessible-exit'}><circle cx="760" cy="95" r="17"/><text x="760" y="101" textAnchor="middle" className="exit-symbol">L</text><text x="760" y="68" textAnchor="middle" className="map-exit-label">CARGO LIFT</text></g>
          <g transform="translate(820 70)"><path d="M0 27 L12 0 L24 27 Z" fill="#47627b"/><text x="12" y="44" textAnchor="middle" className="map-small-label">N</text></g>
        </svg></div>
        <div className="map-legend"><span><i className="legend-route" /> Suggested route</span><span><i className="legend-hall" /> Walkable corridor</span><span><i className="legend-exit" /> Exit / refuge point</span><span><i className="legend-blocked" /> Blocked</span></div>
      </section>
      <aside className="route-summary"><div className="route-summary-head"><span className="route-kicker">RECOMMENDED ROUTE</span><span className="route-status-dot" style={{ background: routeColor }} /></div><h2>{exit.label}</h2><p className="route-destination">{exit.sublabel}</p><div className="route-status-box" style={{ borderColor: routeColor }}><strong>{mainExitBlocked ? 'Rerouted around blocked exit' : wheelchairMode ? 'Step-free route selected' : 'Clear route available'}</strong><span>{mainExitBlocked ? 'Stairwell A is excluded from this path.' : 'Follow the highlighted corridor to the selected exit.'}</span></div><div className="route-steps"><h3>Route instructions</h3>{instructions.map((step, index) => <div className="route-step" key={step}><span>{index + 1}</span><p>{step}</p></div>)}</div><div className="route-distance"><span>Route length</span><strong>{selectedExit === 'main' ? 'Approx. 42 m' : selectedExit === 'secondary' ? 'Approx. 58 m' : selectedExit === 'accessible' ? 'Approx. 36 m' : 'Approx. 61 m'}</strong></div><p className="route-demo-note">Demonstration map only. Confirm routes and conditions with on-site signage and emergency personnel.</p></aside>
    </div>
  </div>;
}

