import React, { useEffect, useMemo, useState } from 'react';
import {
  createScenarioReadings,
  generateDynamicReading,
  keepLatestReadings,
} from '../data/floodTelemetry';

import {
  DEFAULT_FLOOD_THRESHOLDS,
  evaluateFloodReading,
} from '../data/floodAlertEngine';

import { FLOOD_SCENARIOS } from '../data/floodScenarios';
import './FloodResilience.css';

function HydroMetricCard({ title, value, unit, status = 'nominal', subtext }) {
  return (
    <div className={`hydro-glass-card status-${status}`}>
      <div className="card-top-indicator">
        <span className="card-title-text">{title}</span>
        <span className={`status-bubble-pip pip-${status}`} />
      </div>
      <div className="card-metric-value-row">
        <span className="metric-large-num">{value}</span>
        {unit && <span className="metric-unit-tag">{unit}</span>}
      </div>
      <span className="card-sub-footnote">{subtext}</span>
    </div>
  );
}

function HydrologicalTrendChart({ title, readings, dataKey, unit, color = '#0284c7', gradientId }) {
  const values = readings.map((r) => r[dataKey]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = values
    .map((val, idx) => {
      const x = 16 + (idx / Math.max(values.length - 1, 1)) * 568;
      const y = 135 - ((val - minVal) / range) * 105;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `16,140 ${points} 584,140`;

  return (
    <div className="trend-glass-surface">
      <div className="trend-surface-head">
        <div>
          <h4 className="trend-headline">{title}</h4>
          <span className="trend-window-sub">Rolling telemetry buffer ({readings.length} epochs)</span>
        </div>
        <div className="trend-pills-cluster">
          <span className="trend-bound-pill">Min: {minVal.toFixed(2)}</span>
          <span className="trend-bound-pill">Max: {maxVal.toFixed(2)} {unit}</span>
        </div>
      </div>

      <div className="trend-svg-frame">
        <svg viewBox="0 0 600 150" className="hydro-vector-chart" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line x1="16" y1="30" x2="584" y2="30" stroke="rgba(0, 0, 0, 0.04)" strokeDasharray="4 4" />
          <line x1="16" y1="80" x2="584" y2="80" stroke="rgba(0, 0, 0, 0.04)" strokeDasharray="4 4" />
          <line x1="16" y1="135" x2="584" y2="135" stroke="rgba(0, 0, 0, 0.08)" strokeWidth="1" />

          <polygon points={areaPoints} fill={`url(#${gradientId})`} />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="trend-timeline-legend">
        <span>T - {readings.length * 5}s</span>
        <span>Mid-Window Horizon</span>
        <span>Live Epoch (T-0)</span>
      </div>
    </div>
  );
}

function ThresholdSliderRow({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className="slider-control-row">
      <div className="slider-label-row">
        <span className="slider-title">{label}</span>
        <span className="slider-val-tag">
          {value} <small>{unit}</small>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ios-slider-input"
      />
    </div>
  );
}

export default function FloodResilience({ onCriticalSurge = () => {} }) {
  const [mode, setMode] = useState('scenario');
  const [scenario, setScenario] = useState('Normal conditions');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [thresholds, setThresholds] = useState(DEFAULT_FLOOD_THRESHOLDS);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const [readings, setReadings] = useState(() =>
    createScenarioReadings('Normal conditions')
  );

  useEffect(() => {
    if (mode === 'scenario') {
      setReadings(createScenarioReadings(scenario));
    } else {
      setReadings([generateDynamicReading()]);
    }
  }, [mode, scenario]);

  useEffect(() => {
    if (mode !== 'dynamic' || !autoRefresh) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setReadings((previous) => {
        const latest = previous[previous.length - 1] ?? null;
        const next = generateDynamicReading(latest);
        return keepLatestReadings([...previous, next], 30);
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [mode, autoRefresh]);

  const latestReading = readings[readings.length - 1] || { rainfall_mm_h: 0, water_level_m: 0 };

  const alert = useMemo(() => {
    if (!latestReading) return null;
    return evaluateFloodReading(
      latestReading.rainfall_mm_h,
      latestReading.water_level_m,
      thresholds
    );
  }, [latestReading, thresholds]);

  // Cross-system surge trigger callback
  useEffect(() => {
    if (alert && alert.severity === 'CRITICAL') {
      onCriticalSurge(alert);
    }
  }, [alert, onCriticalSurge]);

  const updateThreshold = (key, value) => {
    setThresholds((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const copyAlertJson = () => {
    if (!alert) return;
    navigator.clipboard.writeText(JSON.stringify(alert, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const downloadAlert = () => {
    if (!alert) return;
    const json = JSON.stringify(alert, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ARC_FloodTelemetry_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const recentReadings = [...readings].slice(-8).reverse();
  const severityKey = (alert?.severity || 'NORMAL').toLowerCase();

  return (
    <div className="flood-viewport">
      <header className="flood-glass-header">
        <div>
          <div className="flood-kicker-line">
            <span className="kicker-brand">ARC-SHIELD OS</span>
            <span className="kicker-dot">•</span>
            <span className="kicker-sub">HYDROLOGICAL SURGE &amp; BASIN TELEMETRY</span>
          </div>
          <h1 className="flood-hero-title">Hydrological Flood Resilience Engine</h1>
          <p className="flood-hero-desc">
            Surface drainage runoff modeling, predictive retention depth analysis, and automated barrier triggering matrix.
          </p>
        </div>

        <div className="flood-header-status-box">
          <div className="telemetry-mode-capsule">
            <span className={`telemetry-dot ${mode === 'dynamic' && autoRefresh ? 'is-streaming' : ''}`} />
            <span>{mode === 'dynamic' ? 'STREAMING REAL-TIME' : 'SCENARIO PROFILE'}</span>
          </div>
          <span className="sensor-node-tag">RETENTION BASIN HUB #04-WEST</span>
        </div>
      </header>

      <div className="simulation-glass-disclaimer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          <strong>MODELED TELEMETRY ONLY:</strong> Data reflects computed hydrological simulation matrices. Not connected to active municipal stormwater sluice gates or primary flood sirens.
        </span>
      </div>

      <div className="flood-main-grid">
        <aside className="flood-config-panel">
          <div className="config-head-line">
            <h3 className="config-title">Runoff Engine Controls</h3>
            <span className="config-subtitle">Configure environmental simulation curves</span>
          </div>

          <div className="config-body-flow">
            <div className="config-input-cluster">
              <label className="config-label">Telemetry Stream Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="ios-glass-select"
              >
                <option value="scenario">Reproducible Scenario Profile</option>
                <option value="dynamic">Dynamic Stochastic Stream</option>
              </select>
            </div>

            <div className="config-input-cluster">
              <label className="config-label">Precipitation Scenario</label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                disabled={mode === 'dynamic'}
                className="ios-glass-select"
              >
                {Object.keys(FLOOD_SCENARIOS).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {mode === 'dynamic' && (
              <label className="toggle-stream-row">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="ios-native-checkbox"
                />
                <span className="checkbox-caption">Generate live epoch pulse every 5 seconds</span>
              </label>
            )}

            <div className="thresholds-glass-dock">
              <div className="thresholds-top">
                <span className="dock-title">DISPATCH THRESHOLD LIMITS</span>
                <span className="dock-badge">CALIBRATION</span>
              </div>

              <div className="sliders-stack">
                <ThresholdSliderRow
                  label="Warning Precipitation"
                  value={thresholds.warningRainfall}
                  unit="mm/h"
                  min={5}
                  max={150}
                  step={5}
                  onChange={(v) => updateThreshold('warningRainfall', v)}
                />
                <ThresholdSliderRow
                  label="Critical Precipitation"
                  value={thresholds.criticalRainfall}
                  unit="mm/h"
                  min={20}
                  max={250}
                  step={5}
                  onChange={(v) => updateThreshold('criticalRainfall', v)}
                />
                <ThresholdSliderRow
                  label="Warning Basin Depth"
                  value={thresholds.warningWater}
                  unit="m"
                  min={0.1}
                  max={2.0}
                  step={0.05}
                  onChange={(v) => updateThreshold('warningWater', v)}
                />
                <ThresholdSliderRow
                  label="Spillover Breach Depth"
                  value={thresholds.criticalWater}
                  unit="m"
                  min={0.5}
                  max={3.0}
                  step={0.05}
                  onChange={(v) => updateThreshold('criticalWater', v)}
                />
              </div>
            </div>
          </div>
        </aside>

        <div className="flood-readings-column">
          <div className="hydro-kpis-grid">
            <HydroMetricCard
              title="Precipitation Intensity"
              value={latestReading.rainfall_mm_h.toFixed(1)}
              unit="mm/h"
              status={latestReading.rainfall_mm_h >= thresholds.criticalRainfall ? 'critical' : latestReading.rainfall_mm_h >= thresholds.warningRainfall ? 'warning' : 'nominal'}
              subtext="Optical meteorological sensor"
            />
            <HydroMetricCard
              title="Basin Water Depth"
              value={latestReading.water_level_m.toFixed(3)}
              unit="m"
              status={latestReading.water_level_m >= thresholds.criticalWater ? 'critical' : latestReading.water_level_m >= thresholds.warningWater ? 'warning' : 'nominal'}
              subtext="Hydrostatic pressure node"
            />
            <HydroMetricCard
              title="Surge Classification"
              value={alert?.severity || 'NOMINAL'}
              status={severityKey}
              subtext="Real-time threshold model"
            />
          </div>

          {alert && (
            <div className={`surge-spotlight-card severity-${severityKey}`}>
              <div className="surge-spotlight-header">
                <div className="surge-lead-cluster">
                  <span className="surge-alert-pip" />
                  <span className="surge-headline-text">
                    {alert.severity === 'CRITICAL'
                      ? 'CRITICAL IMMINENT SURGE & OVERFLOW'
                      : alert.severity === 'WARNING'
                      ? 'BASIN CAPACITY PREPAREDNESS ALERT'
                      : 'NORMAL RUNOFF STABILITY'}
                  </span>
                </div>
                <span className="surge-status-badge">{alert.severity}</span>
              </div>

              <p className="surge-action-instruction">{alert.recommended_action}</p>

              {alert.reasons?.length > 0 ? (
                <div className="surge-triggers-wrap">
                  <span className="triggers-label">Threshold Triggers Active:</span>
                  <ul className="triggers-list">
                    {alert.reasons.map((reason, idx) => (
                      <li key={idx} className="trigger-bullet">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="surge-nominal-note">
                  All retention ponds and culvert headwalls are operating well within designed hydraulic safety margins.
                </div>
              )}
            </div>
          )}

          <div className="telemetry-aux-strip">
            <div className="aux-cell">
              <span className="aux-caption">Peak Window Rain</span>
              <span className="aux-reading">{Math.max(...readings.map((r) => r.rainfall_mm_h)).toFixed(1)} mm/h</span>
            </div>
            <div className="aux-cell">
              <span className="aux-caption">Peak Basin Depth</span>
              <span className="aux-reading">{Math.max(...readings.map((r) => r.water_level_m)).toFixed(3)} m</span>
            </div>
            <div className="aux-cell">
              <span className="aux-caption">Retention Inflow Valve</span>
              <span className="aux-reading text-blue">Bypass Armed</span>
            </div>
            <div className="aux-cell">
              <span className="aux-caption">Sump Pumps 1-4</span>
              <span className="aux-reading text-green">Ready (Auto-Float)</span>
            </div>
          </div>
        </div>
      </div>

      <section className="flood-charts-deck">
        <div className="charts-heading-box">
          <h3 className="charts-main-title">Continuous Hydrological Wave Profiles</h3>
          <span className="charts-sub-note">High-frequency sensor telemetry across recent observation frames</span>
        </div>

        <div className="charts-split-grid">
          <HydrologicalTrendChart
            title="Precipitation Intensity Curve"
            readings={readings}
            dataKey="rainfall_mm_h"
            unit="mm/h"
            color="#0284c7"
            gradientId="rainCurveGrad"
          />
          <HydrologicalTrendChart
            title="Basin Water Retention Profile"
            readings={readings}
            dataKey="water_level_m"
            unit="m"
            color="#059669"
            gradientId="waterCurveGrad"
          />
        </div>
      </section>

      <div className="flood-data-dual-grid">
        <section className="flood-data-card">
          <div className="data-card-top">
            <div>
              <h3 className="data-card-title">Recent Telemetry Frames</h3>
              <span className="data-card-sub">Reverse chronological sensor buffer</span>
            </div>
            <span className="data-count-pill">{recentReadings.length} Frames</span>
          </div>

          <div className="table-scroll-wrap">
            <table className="ios-glass-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Precipitation</th>
                  <th>Basin Depth</th>
                  <th>Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {recentReadings.map((r) => {
                  const isElevated = r.water_level_m >= thresholds.warningWater;
                  return (
                    <tr key={r.timestamp}>
                      <td className="font-mono">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td>{r.rainfall_mm_h.toFixed(1)} mm/h</td>
                      <td>{r.water_level_m.toFixed(3)} m</td>
                      <td>
                        <span className={`table-status-badge ${isElevated ? 'badge-elevated' : 'badge-nominal'}`}>
                          {isElevated ? 'ELEVATED' : 'NOMINAL'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flood-data-card">
          <div className="data-card-top">
            <div>
              <h3 className="data-card-title">Structured Dispatch Payload</h3>
              <span className="data-card-sub">ARC-Shield microservice audit JSON</span>
            </div>
            <div className="payload-action-btns">
              <button type="button" className="btn-payload-ghost" onClick={copyAlertJson}>
                {copiedPayload ? 'Copied' : 'Copy Object'}
              </button>
              <button type="button" className="btn-payload-primary" onClick={downloadAlert}>
                Download .JSON
              </button>
            </div>
          </div>

          <pre className="ios-code-drawer">
            <code>{JSON.stringify(alert, null, 2)}</code>
          </pre>
        </section>
      </div>

      <footer className="flood-mitigation-dock">
        <h4 className="mitigation-dock-title">Mitigation &amp; Sluice Intervention Protocols</h4>
        <div className="mitigation-three-columns">
          <div className="mitigation-col">
            <span className="mitigation-pill pill-nominal">CONDITION NOMINAL</span>
            <p className="mitigation-text">
              Routine gravity outflow. Maintenance personnel verify trash screens and culvert headwalls remain free of debris every 72 hours.
            </p>
          </div>
          <div className="mitigation-col">
            <span className="mitigation-pill pill-warning">CONDITION WARNING</span>
            <p className="mitigation-text">
              Inspect basement sump pits. Submersible pumps 1-4 are engaged on auto-float switch triggers. Modular flood barriers placed on standby.
            </p>
          </div>
          <div className="mitigation-col">
            <span className="mitigation-pill pill-critical">CONDITION CRITICAL</span>
            <p className="mitigation-text">
              Immediate deployment of perimeter modular flood barriers. Alert carpark security to evacuate vehicles from subterranean basements.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}