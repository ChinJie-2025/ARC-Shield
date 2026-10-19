import React, { useState, useMemo } from 'react';
import './EvacuationMap.css';
import EvacuationScene from './EvacuationScene';

const NODES = {
  junc_central: { id: 'junc_central', x: 450, y: 270, label: 'Central Junction 01' },
  junc_east_aux: { id: 'junc_east_aux', x: 650, y: 270, label: 'East Auxiliary Bay' },
  junc_cargo_turn: { id: 'junc_cargo_turn', x: 650, y: 95, label: 'Freight Hoistway Turn' },
  refuge_bay: { id: 'refuge_bay', x: 537, y: 190, label: 'Pressurized Conference Refuge' },
};

const EXITS = {
  main: {
    id: 'main',
    label: 'Primary Exit Portal',
    sublabel: 'Stairwell A (East Core)',
    type: 'Fire Stairs',
    clearance: 'Standard Egress',
    accessible: false,
    x: 760,
    y: 270,
  },
  secondary: {
    id: 'secondary',
    label: 'Secondary Relief Exit',
    sublabel: 'Stairwell B (West Core)',
    type: 'Fire Stairs',
    clearance: 'Active Alternative',
    accessible: false,
    x: 100,
    y: 270,
  },
  accessible: {
    id: 'accessible',
    label: 'Direct Evacuation Lift A',
    sublabel: 'Pressurized Shaft (EN81-76 Standby)',
    type: 'Accessible Lift',
    clearance: 'Barrier-Free Direct',
    accessible: true,
    x: 450,
    y: 95,
  },
  cargo: {
    id: 'cargo',
    label: 'Assisted Service Lift',
    sublabel: 'Cargo Bay 02 Corridor',
    type: 'Heavy Freight Hoist',
    clearance: 'Assisted Clearance',
    accessible: true,
    x: 760,
    y: 95,
  },
};

const PRESET_SPAWNS = [
  { id: 'lobby', label: 'South Lobby Entry', x: 450, y: 420 },
  { id: 'office', label: 'Office Suite Wing', x: 370, y: 270 },
  { id: 'conf', label: 'Conference Corridor', x: 540, y: 270 },
];

export default function EvacuationMap({ activeHazards = [] }) {
  const [userPos, setUserPos] = useState({ x: 450, y: 420, label: 'South Lobby Entry' });
  const [stairABlocked, setStairABlocked] = useState(false);
  const [stairBBlocked, setStairBBlocked] = useState(false);
  const [wheelchairMode, setWheelchairMode] = useState(false);
  const [gpsTracking, setGpsTracking] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState(3);
  const [detailFloor, setDetailFloor] = useState(null);
  const [gpsMessage, setGpsMessage] = useState('');

  const handleLocate = () => {
    if (!navigator.geolocation) { setGpsMessage('Location is not supported by this browser.'); return; }
    setGpsMessage('Requesting your location…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setUserPos({ x: 450, y: 420, label: `GPS located · ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} · entry point` });
      setGpsTracking(true); setGpsMessage('GPS located. Confirm your level and corridor on the model.');
    }, () => { setGpsTracking(false); setGpsMessage('Location unavailable. Choose a starting point or enter it manually.'); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 });
  };

  // Dynamic Routing Solver
  const routeCalculation = useMemo(() => {
    let target = null;
    let isDeadlock = false;

    if (wheelchairMode) {
      if (!stairABlocked) {
        target = EXITS.accessible;
      } else {
        target = EXITS.cargo;
      }
    } else {
      if (!stairABlocked) {
        target = EXITS.main;
      } else if (!stairBBlocked) {
        target = EXITS.secondary;
      } else {
        target = {
          id: 'refuge',
          label: 'Emergency Safe Refuge Bay',
          sublabel: 'Conference Suite 103 (Positive Air Pressure)',
          type: 'Shelter-in-Place',
          clearance: 'Sealed Fire Barrier',
          x: NODES.refuge_bay.x,
          y: NODES.refuge_bay.y,
        };
        isDeadlock = true;
      }
    }

    let pathD = `M ${userPos.x} ${userPos.y}`;

    if (userPos.y > NODES.junc_central.y) {
      pathD += ` L ${userPos.x} ${NODES.junc_central.y}`;
    }

    if (userPos.x !== NODES.junc_central.x && userPos.y !== NODES.junc_central.y) {
      pathD += ` L ${NODES.junc_central.x} ${NODES.junc_central.y}`;
    }

    if (target.id === 'main' || target.id === 'secondary') {
      pathD += ` L ${NODES.junc_central.x} ${NODES.junc_central.y} L ${target.x} ${target.y}`;
    } else if (target.id === 'accessible') {
      pathD += ` L ${target.x} ${NODES.junc_central.y} L ${target.x} ${target.y}`;
    } else if (target.id === 'cargo') {
      pathD += ` L ${NODES.junc_central.x} ${NODES.junc_central.y} L ${NODES.junc_east_aux.x} ${NODES.junc_east_aux.y} L ${NODES.junc_cargo_turn.x} ${NODES.junc_cargo_turn.y} L ${target.x} ${target.y}`;
    } else if (isDeadlock) {
      pathD += ` L ${NODES.junc_central.x} ${NODES.junc_central.y} L ${target.x} ${target.y}`;
    }

    const deltaX = Math.abs(userPos.x - target.x);
    const deltaY = Math.abs(userPos.y - target.y);
    const interFloorMeters = isDeadlock ? 0 : Math.max(0, selectedFloor - 1) * (wheelchairMode ? 22 : 28);
    const distanceMeters = Math.max(18, Math.round((deltaX + deltaY) / 9.5 + interFloorMeters));
    const estSeconds = Math.round(distanceMeters * (wheelchairMode ? 1.3 : 1.18));

    return { target, isDeadlock, pathD, distanceMeters, estSeconds };
  }, [userPos, stairABlocked, stairBBlocked, wheelchairMode, selectedFloor]);

  const { target, isDeadlock, pathD, distanceMeters, estSeconds } = routeCalculation;

  const routeColor = isDeadlock
    ? '#dc2626'
    : stairABlocked || stairBBlocked
    ? '#ea580c'
    : wheelchairMode
    ? '#0284c7'
    : '#10b981';

  return (
    <div className="evac-viewport">
      <header className="evac-glass-header">
        <div>
          <div className="evac-kicker-row">
            <span className="evac-kicker-brand">ARC-SHIELD OS</span>
            <span className="evac-kicker-dot">•</span>
            <span className="evac-kicker-sub">SPATIAL LIFE-SAFETY WAYFINDING</span>
          </div>
          <h1 className="evac-hero-title">Adaptive Evacuation Vector Planner</h1>
          <p className="evac-hero-desc">
            Autonomous egress computing engine. Click anywhere on walkable corridors to calibrate occupant beacon coordinates.
          </p>
        </div>

        <div className="evac-header-widgets">
          <div className="evac-live-chip">
            <span className="evac-pulse-dot" />
            DIJKSTRA VECTOR SOLVER ACTIVE
          </div>
          <div className={`gps-indicator-capsule ${gpsTracking ? 'is-tracking' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              <circle cx="12" cy="12" r="8" />
            </svg>
            <span>{userPos.label}</span>
          </div>
          <button type="button" className="btn-origin-chip" onClick={handleLocate}>Use my location</button>
          {gpsMessage && <span className="gps-feedback" role="status">{gpsMessage}</span>}
        </div>
      </header>

      {/* Simulation Scenario Controls */}
      <section className="simulation-glass-deck">
        <div className="simulation-deck-text">
          <div className="deck-headline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <strong>Interactive Threat &amp; Mobility Injections</strong>
          </div>
          <span className="deck-sub-note">Toggle multiple structural failures to test automated fallback rerouting.</span>
        </div>

        <div className="simulation-switches-group">
          <label className={`ios-scenario-pill ${stairABlocked ? 'is-hazard-active' : ''}`}>
            <input
              type="checkbox"
              className="native-checkbox"
              checked={stairABlocked}
              onChange={(e) => setStairABlocked(e.target.checked)}
            />
            <div className="ios-pill-switch">
              <span className="pill-knob" />
            </div>
            <div className="pill-text-cluster">
              <span className="pill-main-label">Block East Stairwell A</span>
              <span className="pill-sub-label">Simulate smoke / debris</span>
            </div>
          </label>

          <label className={`ios-scenario-pill ${stairBBlocked ? 'is-hazard-active' : ''}`}>
            <input
              type="checkbox"
              className="native-checkbox"
              checked={stairBBlocked}
              onChange={(e) => setStairBBlocked(e.target.checked)}
            />
            <div className="ios-pill-switch">
              <span className="pill-knob" />
            </div>
            <div className="pill-text-cluster">
              <span className="pill-main-label">Block West Stairwell B</span>
              <span className="pill-sub-label">Simulate exit failure</span>
            </div>
          </label>

          <label className={`ios-scenario-pill ${wheelchairMode ? 'is-access-active' : ''}`}>
            <input
              type="checkbox"
              className="native-checkbox"
              checked={wheelchairMode}
              onChange={(e) => setWheelchairMode(e.target.checked)}
            />
            <div className="ios-pill-switch">
              <span className="pill-knob" />
            </div>
            <div className="pill-text-cluster">
              <span className="pill-main-label">Step-Free Mobility Mode</span>
              <span className="pill-sub-label">EN81-76 Pressurized Lifts</span>
            </div>
          </label>
        </div>
      </section>

      {/* Preset Spawns */}
      <div className="origin-presets-strip">
        <span className="presets-label">Spawn Occupant Beacon:</span>
        <div className="presets-buttons">
          {PRESET_SPAWNS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn-origin-chip ${userPos.label === p.label ? 'is-active' : ''}`}
              onClick={() => setUserPos(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="evac-workspace-grid">
        <section className="floorplan-glass-card">
          <div className="floorplan-header-bar">
            <div className="floor-badge-cluster">
                <span className="level-pill">LEVEL {String(selectedFloor).padStart(2, '0')}</span>
              <div>
                <h3 className="floor-plan-title">{detailFloor ? `Level ${String(detailFloor).padStart(2, '0')} · Route detail` : 'Continuous 3D evacuation route'}</h3>
                <span className="floor-plan-sub">{selectedFloor > 1 ? `LEVEL ${String(selectedFloor).padStart(2, '0')} → ${target?.id === 'secondary' ? 'STAIR B' : target?.id === 'accessible' || target?.id === 'cargo' ? 'EVACUATION LIFT' : 'STAIR A'} → LEVEL 01 → ASSEMBLY` : 'GROUND LEVEL ROUTE → ASSEMBLY'}</span>
              </div>
            </div>
            <div className="route-state-chip" style={{ borderColor: routeColor, color: routeColor }}>
              <span className="route-state-pip" style={{ background: routeColor }} />
              {isDeadlock ? 'SHELTER IN REFUGE' : stairABlocked || stairBBlocked ? 'REROUTED ESCAPE VECTOR' : 'OPTIMAL ESCAPE CLEAR'}
            </div>
          </div>

          <div className="map-view-toolbar">
            <div className="map-view-switch" role="group" aria-label="Route view">
              <button type="button" className={!detailFloor ? 'is-active' : ''} onClick={() => setDetailFloor(null)}>Full route</button>
            </div>
            <div className="floor-selector" role="group" aria-label="Starting floor">
              {[3, 2, 1].map((floor) => <button key={floor} type="button" className={selectedFloor === floor ? 'is-active' : ''} onClick={() => { setSelectedFloor(floor); setDetailFloor(floor); }}>Level {String(floor).padStart(2, '0')}</button>)}
            </div>
            <div className="orbit-controls"><span className="orbit-instruction">Drag to orbit · scroll to zoom · click a floor to inspect</span></div>
          </div>

          <EvacuationScene userPos={userPos} target={target} routeColor={routeColor} activeHazards={activeHazards} selectedFloor={selectedFloor} detailFloor={detailFloor} onSelectFloor={(floor) => { setSelectedFloor(floor); setDetailFloor(floor); }} />

          <div className="floorplan-legend-row">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: routeColor }} />
              <span>Dynamic Vector</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot bg-hall" />
              <span>Fire Corridor</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot bg-stair" />
              <span>Fire Stairwell / Refuge Bay</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot bg-hazard" />
              <span>Structural Barrier</span>
            </div>
          </div>
        </section>

        <aside className="dossier-glass-panel">
          <div className="dossier-header-block">
            <span className="dossier-eyebrow">DIJKSTRA COMPUTED WAYFINDING DOSSIER</span>
            <div className="dossier-exit-name-row">
              <h2 className="dossier-exit-title">{target.label}</h2>
              <span className={`dossier-type-badge ${isDeadlock ? 'badge-deadlock' : ''}`}>{target.type}</span>
            </div>
            <p className="dossier-sublabel">{target.sublabel}</p>
          </div>

          <div className="dossier-telemetry-shelf">
            <div className="shelf-metric-item">
              <span className="shelf-val">{distanceMeters} m</span>
              <span className="shelf-label">Distance</span>
            </div>
            <div className="shelf-metric-item">
              <span className="shelf-val">~{estSeconds} sec</span>
              <span className="shelf-label">Est. Clearance</span>
            </div>
            <div className="shelf-metric-item">
              <span className="shelf-val">{target.clearance}</span>
              <span className="shelf-label">Specification</span>
            </div>
          </div>

          <div className={`advisory-status-capsule ${isDeadlock ? 'is-deadlock' : stairABlocked || stairBBlocked ? 'is-rerouted' : ''}`}>
            <div className="advisory-icon-wrapper">
              {isDeadlock ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ) : stairABlocked || stairBBlocked ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div>
              <strong className="advisory-title">
                {isDeadlock
                  ? 'All Primary Egress Blocked • Shelter in Place'
                  : stairABlocked || stairBBlocked
                  ? 'Dynamic Reroute Active'
                  : wheelchairMode
                  ? 'Step-Free Vector Active'
                  : 'Primary Egress Vector Nominal'}
              </strong>
              <p className="advisory-copy">
                {isDeadlock
                  ? 'Both East and West Stairwells are impassable. Proceed immediately to Conference Suite 103, seal doors, and await tactical rescue units.'
                  : stairABlocked
                  ? 'Stairwell A excluded from routing matrix. Occupants diverted to West Stairwell B.'
                  : wheelchairMode
                  ? 'Navigating to EN81-76 Pressurized Elevator Shaft with dedicated standby emergency power.'
                  : 'Corridors nominal. Follow illuminated green wayfinding indicators toward primary fire doors.'}
              </p>
            </div>
          </div>

          <div className="steps-hierarchy-block">
            <span className="steps-heading">SEQUENTIAL WAYFINDING STEPS</span>
            <div className="steps-vertical-flow">
              <div className="step-card-ios">
                <div className="step-number-bubble">01</div>
                <div className="step-info">
                  <span className="step-lead-text">Origin: {userPos.label}</span>
                    <p className="step-body-copy">{selectedFloor > 1 ? `Follow the marked corridor to ${wheelchairMode ? 'the evacuation lift' : `Stairwell ${target.id === 'secondary' ? 'B' : 'A'}`} on Level ${selectedFloor}.` : 'Advance toward the nearest signed exit route and keep the corridor clear.'}</p>
                </div>
              </div>
              <div className="step-card-ios">
                <div className="step-number-bubble">02</div>
                <div className="step-info">
                  <span className="step-lead-text">Central Junction 01</span>
                  <p className="step-body-copy">
                    {isDeadlock
                      ? 'Turn right into sealed Conference Suite 103 refuge bay.'
                      : target.id === 'secondary'
                      ? `Use the west corridor to reach Stairwell B${selectedFloor > 1 ? `, then descend to Level 01` : ''}.`
                      : target.id === 'accessible' || target.id === 'cargo'
                      ? `Enter the protected evacuation lift and travel down to Level 01.`
                      : `Use the east corridor to reach Stairwell A${selectedFloor > 1 ? `, then descend to Level 01` : ''}.`}
                  </p>
                </div>
              </div>
              <div className="step-card-ios">
                <div className="step-number-bubble">03</div>
                <div className="step-info">
                  <span className="step-lead-text">{target.label}</span>
                  <p className="step-body-copy">
                    {isDeadlock
                      ? 'Engage door seals and activate emergency intercom.'
                      : selectedFloor > 1
                      ? 'At Level 01, follow the ground-level exit signs to the designated outdoor assembly area. Do not use passenger lifts.'
                      : 'Follow the ground-level exit signs to the designated outdoor assembly area.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="dossier-footer-note">
            <p>
              Autonomous spatial telemetry. In active fire conditions, comply with emergency floor wardens and primary audible alert horns.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
