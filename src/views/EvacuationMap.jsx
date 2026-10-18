import React, { useState, useMemo } from 'react';
import './EvacuationMap.css';

// Floor waypoints and navigational graph nodes
const NODES = {
  junc_central: { id: 'junc_central', x: 450, y: 270, label: 'Central Junction 01' },
  junc_east_aux: { id: 'junc_east_aux', x: 650, y: 270, label: 'East Auxiliary Bay' },
  junc_cargo_turn: { id: 'junc_cargo_turn', x: 650, y: 95, label: 'Freight Hoistway Turn' },
  refuge_bay: { id: 'refuge_bay', x: 537, y: 190, label: 'Pressurized Conference Refuge (Positive Air Barrier)' },
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

// Preset occupant origin coordinates
const PRESET_SPAWNS = [
  { id: 'lobby', label: 'South Lobby Entry', x: 450, y: 420 },
  { id: 'office', label: 'Office Suite Wing', x: 370, y: 270 },
  { id: 'conf', label: 'Conference Corridor', x: 540, y: 270 },
];

export default function EvacuationMap() {
  const [userPos, setUserPos] = useState({ x: 450, y: 420, label: 'South Lobby Entry' });
  const [stairABlocked, setStairABlocked] = useState(false);
  const [stairBBlocked, setStairBBlocked] = useState(false);
  const [wheelchairMode, setWheelchairMode] = useState(false);
  const [gpsTracking, setGpsTracking] = useState(true);

  // Dynamic Routing Engine
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
        // Complete stairwell deadlock: shelter in pressurized safe refuge
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

    // Build SVG Path string from user origin through waypoints
    let pathD = `M ${userPos.x} ${userPos.y}`;

    // If starting south of central junction
    if (userPos.y > NODES.junc_central.y) {
      pathD += ` L ${userPos.x} ${NODES.junc_central.y}`;
    }

    if (userPos.x !== NODES.junc_central.x && userPos.y !== NODES.junc_central.y) {
      pathD += ` L ${NODES.junc_central.x} ${NODES.junc_central.y}`;
    }

    if (target.id === 'main') {
      pathD += ` L ${NODES.junc_central.x} ${NODES.junc_central.y} L ${target.x} ${target.y}`;
    } else if (target.id === 'secondary') {
      pathD += ` L ${NODES.junc_central.x} ${NODES.junc_central.y} L ${target.x} ${target.y}`;
    } else if (target.id === 'accessible') {
      pathD += ` L ${target.x} ${NODES.junc_central.y} L ${target.x} ${target.y}`;
    } else if (target.id === 'cargo') {
      pathD += ` L ${NODES.junc_central.x} ${NODES.junc_central.y} L ${NODES.junc_east_aux.x} ${NODES.junc_east_aux.y} L ${NODES.junc_cargo_turn.x} ${NODES.junc_cargo_turn.y} L ${target.x} ${target.y}`;
    } else if (isDeadlock) {
      pathD += ` L ${NODES.junc_central.x} ${NODES.junc_central.y} L ${target.x} ${target.y}`;
    }

    // Approx 10px = 1 meter
    const deltaX = Math.abs(userPos.x - target.x);
    const deltaY = Math.abs(userPos.y - target.y);
    const distanceMeters = Math.max(18, Math.round((deltaX + deltaY) / 9.5));
    const estSeconds = Math.round(distanceMeters * (wheelchairMode ? 1.3 : 1.05));

    return {
      target,
      isDeadlock,
      pathD,
      distanceMeters,
      estSeconds,
    };
  }, [userPos, stairABlocked, stairBBlocked, wheelchairMode]);

  const { target, isDeadlock, pathD, distanceMeters, estSeconds } = routeCalculation;

  const routeColor = isDeadlock
    ? '#dc2626' // Red shelter-in-place
    : stairABlocked || stairBBlocked
    ? '#ea580c' // Orange rerouted
    : wheelchairMode
    ? '#0284c7' // Blue step-free
    : '#10b981'; // Green clear

  // Interactive floor click handler
  const handleMapClick = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 900);
    const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 540);

    // Snap to walkable corridor grid boundaries
    if (clickX >= 80 && clickX <= 820 && clickY >= 80 && clickY <= 460) {
      setUserPos({
        x: clickX,
        y: clickY,
        label: `Corridor Marker (${clickX}, ${clickY})`,
      });
      setGpsTracking(true);
    }
  };

  return (
    <div className="evac-viewport">
      {/* Header Deck */}
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

      {/* Origin Fast-Switcher Chips */}
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

      {/* Main Floorplan Workspace */}
      <div className="evac-workspace-grid">
        {/* Left: Floorplan Architectural Viewer */}
        <section className="floorplan-glass-card">
          <div className="floorplan-header-bar">
            <div className="floor-badge-cluster">
              <span className="level-pill">LEVEL 01</span>
              <div>
                <h3 className="floor-plan-title">Architectural Evacuation Blueprint</h3>
                <span className="floor-plan-sub">CLICK MAP TO CALIBRATE OCCUPANT POSITION</span>
              </div>
            </div>
            <div className="route-state-chip" style={{ borderColor: routeColor, color: routeColor }}>
              <span className="route-state-pip" style={{ background: routeColor }} />
              {isDeadlock ? 'SHELTER IN REFUGE' : stairABlocked || stairBBlocked ? 'REROUTED ESCAPE VECTOR' : 'OPTIMAL ESCAPE CLEAR'}
            </div>
          </div>

          <div className="cad-svg-viewport">
            <svg
              className="blueprint-svg interactive-cursor"
              viewBox="0 0 900 540"
              role="img"
              onClick={handleMapClick}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <pattern id="ios-cad-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(0, 0, 0, 0.04)" strokeWidth="1" />
                </pattern>
                
                {/* Directional Chevron Marker for Real-Time Wayfinding Flow */}
                <marker
                  id="chevron-arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 6 5 L 0 9" fill="none" stroke={routeColor} strokeWidth="2.5" strokeLinecap="round" />
                </marker>

                <filter id="vector-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Floorplate Background */}
              <rect width="900" height="540" fill="#f8fafc" />
              <rect width="900" height="540" fill="url(#ios-cad-grid)" />

              {/* Perimeter Wall */}
              <rect x="35" y="42" width="830" height="456" rx="16" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" />

              {/* Architectural Rooms */}
              <rect x="70" y="78" width="175" height="112" rx="8" className="svg-room-block" />
              <text x="157" y="128" textAnchor="middle" className="svg-room-title">LOBBY / RECEPTION</text>
              <text x="157" y="146" textAnchor="middle" className="svg-room-meta">Zone 101 • Standard</text>

              <rect x="315" y="78" width="110" height="112" rx="8" className="svg-room-block" />
              <text x="370" y="132" textAnchor="middle" className="svg-room-title">OFFICE SUITE</text>
              <text x="370" y="148" textAnchor="middle" className="svg-room-meta">Zone 102</text>

              {/* Conference Refuge Bay */}
              <rect
                x="480"
                y="78"
                width="115"
                height="112"
                rx="8"
                className={`svg-room-block ${isDeadlock ? 'svg-room-refuge-active' : ''}`}
              />
              <text x="537" y="130" textAnchor="middle" className="svg-room-title">CONF SUITE 103</text>
              <text x="537" y="148" textAnchor="middle" className={`svg-room-meta ${isDeadlock ? 'text-refuge-bold' : ''}`}>
                {isDeadlock ? 'SAFE REFUGE BAY' : 'Zone 103'}
              </text>

              <rect x="675" y="345" width="150" height="115" rx="8" className="svg-room-block" />
              <text x="750" y="398" textAnchor="middle" className="svg-room-title">AMENITIES</text>
              <text x="750" y="416" textAnchor="middle" className="svg-room-meta">Staff Hub &amp; Pantry</text>

              <rect x="75" y="345" width="150" height="115" rx="8" className="svg-room-block" />
              <text x="150" y="398" textAnchor="middle" className="svg-room-title">MEP / SERVICE</text>
              <text x="150" y="416" textAnchor="middle" className="svg-room-meta">Restricted Core</text>

              {/* Partitions */}
              <path d="M245 195 V345 M315 195 V240 M425 195 V240 M480 195 V345 M595 195 V240 M675 195 V345" className="svg-wall-line" />
              <path d="M245 345 H315 M425 345 H480 M595 345 H675 M245 195 H315 M425 195 H480 M595 195 H675" className="svg-wall-line" />

              {/* Corridors Base Geometry */}
              <path d="M450 420 V270 M450 270 H760 M450 270 H100 M450 270 V95 M450 270 H650 V95 H760" className="svg-corridor-track" />

              {/* Live Calculated Path Glow & Line */}
              <path
                d={pathD}
                className="svg-route-glow"
                style={{ stroke: routeColor }}
                filter="url(#vector-glow)"
              />
              <path
                d={pathD}
                className="svg-route-animated"
                style={{ stroke: routeColor }}
                markerEnd="url(#chevron-arrow)"
              />

              {/* Occupant Location Beacon */}
              <circle cx={userPos.x} cy={userPos.y} r="20" className="svg-beacon-ring" />
              <circle cx={userPos.x} cy={userPos.y} r="7" className="svg-beacon-dot" />
              <g transform={`translate(${userPos.x - 60}, ${userPos.y + 16})`}>
                <rect width="120" height="22" rx="11" fill="#0f172a" />
                <text x="60" y="15" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800" letterSpacing="0.06em">
                  YOU ARE HERE
                </text>
              </g>

              {/* Central Junction Hub */}
              <circle cx={NODES.junc_central.x} cy={NODES.junc_central.y} r="6" fill="#64748b" />
              <text x={NODES.junc_central.x} y={NODES.junc_central.y - 12} textAnchor="middle" className="svg-junction-label">
                JUNCTION 01
              </text>

              {/* Exit Nodes */}
              {/* Stairwell A */}
              <g className={`svg-exit-node ${target.id === 'main' ? 'is-selected' : ''} ${stairABlocked ? 'is-blocked' : ''}`}>
                <circle cx={EXITS.main.x} cy={EXITS.main.y} r="18" />
                <text x={EXITS.main.x} y={EXITS.main.y + 5} textAnchor="middle" className="node-symbol">
                  {stairABlocked ? '✕' : 'A'}
                </text>
                <text x={EXITS.main.x} y={EXITS.main.y + 36} textAnchor="middle" className="node-title">STAIRWELL A</text>
                {stairABlocked && (
                  <text x={EXITS.main.x} y={EXITS.main.y + 50} textAnchor="middle" className="node-blocked-tag">BLOCKED</text>
                )}
              </g>

              {/* Stairwell B */}
              <g className={`svg-exit-node ${target.id === 'secondary' ? 'is-selected' : ''} ${stairBBlocked ? 'is-blocked' : ''}`}>
                <circle cx={EXITS.secondary.x} cy={EXITS.secondary.y} r="18" />
                <text x={EXITS.secondary.x} y={EXITS.secondary.y + 5} textAnchor="middle" className="node-symbol">
                  {stairBBlocked ? '✕' : 'B'}
                </text>
                <text x={EXITS.secondary.x} y={EXITS.secondary.y + 36} textAnchor="middle" className="node-title">STAIRWELL B</text>
                {stairBBlocked && (
                  <text x={EXITS.secondary.x} y={EXITS.secondary.y + 50} textAnchor="middle" className="node-blocked-tag">BLOCKED</text>
                )}
              </g>

              {/* Evacuation Lift A */}
              <g className={`svg-exit-node lift-node ${target.id === 'accessible' ? 'is-selected' : ''}`}>
                <circle cx={EXITS.accessible.x} cy={EXITS.accessible.y} r="18" />
                <text x={EXITS.accessible.x} y={EXITS.accessible.y + 5} textAnchor="middle" className="node-symbol">EL-1</text>
                <text x={EXITS.accessible.x} y={EXITS.accessible.y - 26} textAnchor="middle" className="node-title">EVAC LIFT A</text>
              </g>

              {/* Cargo Lift */}
              <g className={`svg-exit-node lift-node ${target.id === 'cargo' ? 'is-selected' : ''}`}>
                <circle cx={EXITS.cargo.x} cy={EXITS.cargo.y} r="18" />
                <text x={EXITS.cargo.x} y={EXITS.cargo.y + 5} textAnchor="middle" className="node-symbol">CL-2</text>
                <text x={EXITS.cargo.x} y={EXITS.cargo.y - 26} textAnchor="middle" className="node-title">CARGO LIFT</text>
              </g>

              {/* Compass Needle */}
              <g transform="translate(820, 62)">
                <circle cx="14" cy="14" r="15" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <path d="M14 4 L18 16 L14 13 L10 16 Z" fill="#0f172a" />
                <text x="14" y="39" textAnchor="middle" fontSize="10" fontWeight="800" fill="#64748b">N</text>
              </g>
            </svg>
          </div>

          {/* Blueprint Legend */}
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

        {/* Right: Technical Routing Dossier */}
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
                  <p className="step-body-copy">Advance toward central illuminated corridor spine.</p>
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
                      ? 'Turn left away from the blocked east core toward Stairwell B.'
                      : target.id === 'accessible'
                      ? 'Proceed straight north into the pressurized lift lobby.'
                      : 'Turn right toward Stairwell A fire escape doors.'}
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
                      : 'Maintain right banister spacing down to Ground Assembly Area A.'}
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