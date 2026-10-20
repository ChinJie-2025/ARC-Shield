import React from 'react';

export default function EvacuationStackPlan({ selectedFloor, target, routeColor, activeHazards = [] }) {
  const viaLift = target?.id === 'accessible' || target?.id === 'cargo';
  const viaWestStair = target?.id === 'secondary';
  const routeX = viaLift ? 345 : viaWestStair ? 92 : 592;
  return <section className="stack-plan-overview" aria-label="Continuous evacuation route across three floors">
    <div className="stack-plan-heading"><div><strong>CONTINUOUS MULTI-LEVEL ROUTE</strong><span>One connected path from Level {String(selectedFloor).padStart(2, '0')} to the ground assembly exit</span></div><b>{viaLift ? 'PROTECTED LIFT' : viaWestStair ? 'STAIR B' : 'STAIR A'} ↓ LEVEL 01</b></div>
    <div className="stack-plan-levels">
      {[3, 2, 1].map((floor) => {
        const active = floor <= selectedFloor;
        const isStart = floor === selectedFloor;
        const isGround = floor === 1;
        const startX = 165;
        let path = '';
        if (active && isStart && isGround) path = `M ${startX} 58 H ${routeX} ${viaLift ? 'H 668' : viaWestStair ? 'H 28' : 'H 668'}`;
        else if (active && isStart) path = `M ${startX} 58 H ${routeX}`;
        else if (active && isGround && !viaLift) path = `M ${routeX} 58 H ${viaWestStair ? 28 : 668}`;
        else if (active && isGround && viaLift) path = `M ${routeX} 58 H 668`;
        return <React.Fragment key={floor}>
          <article className={`stack-plan-level ${isStart ? 'is-origin' : ''} ${isGround ? 'is-destination' : ''}`}>
            <div className="stack-plan-level-label"><strong>LEVEL {String(floor).padStart(2, '0')}</strong><span>{isStart ? 'OCCUPANT START' : isGround ? 'GROUND EXIT' : active ? 'STAIR LANDING' : 'NEXT LEVEL UP'}</span></div>
            <svg viewBox="0 0 700 116" role="img" aria-label={`Level ${floor} route segment`}>
              <rect x="18" y="17" width="664" height="82" rx="9" fill="#f8fafc" stroke="#cbd8e3" strokeWidth="2"/>
              <rect x="38" y="28" width="118" height="28" rx="4" fill="#e5edf3"/><text x="97" y="46" textAnchor="middle">LOBBY</text>
              <rect x="175" y="28" width="108" height="28" rx="4" fill="#e5edf3"/><text x="229" y="46" textAnchor="middle">OFFICE</text>
              <rect x="300" y="28" width="112" height="28" rx="4" fill={activeHazards.length && isStart ? '#fee2e2' : '#e5edf3'}/><text x="356" y="46" textAnchor="middle">REFUGE</text>
              <path d="M38 58 H660" stroke="#d3e0ea" strokeWidth="17" strokeLinecap="round"/>
              {active && path && <path d={path} fill="none" stroke={routeColor} strokeWidth="5" strokeLinecap="round" strokeDasharray="10 7"/>}
              {isStart && <g><circle cx={startX} cy="58" r="10" fill="#0284c7" stroke="#fff" strokeWidth="3"/><text x={startX} y="88" textAnchor="middle">YOU</text></g>}
              {viaLift ? <g><rect x="319" y="43" width="52" height="32" rx="5" fill="#d7edf8" stroke="#2783b3" strokeWidth="2"/><text x="345" y="63" textAnchor="middle">LIFT</text></g> : <g><rect x={viaWestStair ? 60 : 568} y="40" width="48" height="36" rx="5" fill={active ? '#dceaf4' : '#edf2f6'} stroke={active ? '#55728e' : '#a9bac9'} strokeWidth="2"/><text x={viaWestStair ? 84 : 592} y="63" textAnchor="middle">{viaWestStair ? 'B' : 'A'}</text><path d={viaWestStair ? 'M84 44v27' : 'M592 44v27'} stroke="#55728e" strokeWidth="2" strokeDasharray="3 3"/></g>}
              {isGround && <g><circle cx={viaLift ? 668 : viaWestStair ? 28 : 668} cy="58" r="9" fill="#15803d"/><text x={viaWestStair ? 60 : 625} y="89" textAnchor="middle">ASSEMBLY</text></g>}
              {activeHazards.length > 0 && isStart && <g><circle cx="440" cy="58" r="10" fill="#dc2626"/><text x="440" y="62" textAnchor="middle" fill="#fff">!</text></g>}
            </svg>
          </article>
          {floor > 1 && active && <div className="stack-plan-connector"><span />DESCEND VIA {viaLift ? 'PROTECTED LIFT' : `STAIRWELL ${viaWestStair ? 'B' : 'A'}`}<span /></div>}
        </React.Fragment>;
      })}
    </div>
  </section>;
}
