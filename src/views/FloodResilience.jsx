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

function MetricKpiCard({ title, value, unit, status = 'default', hint }) {
  return (
    <div className={`hydro-kpi-card status-${status}`}>
      <div className="hydro-kpi-header">
        <span className="hydro-kpi-title">{title}</span>
        <span className="hydro-status-pip" />
      </div>
      <div className="hydro-kpi-body">
        <span className="hydro-kpi-val">{value}</span>
        {unit && <span className="hydro-kpi-unit">{unit}</span>}
      </div>
      <div className="hydro-kpi-hint">{hint}</div>
    </div>
  );
}

function HydrologicalTrendChart({ title, readings, dataKey, unit, color = '#0284c7', gradientId }) {
  const values = readings.map((r) => r[dataKey]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Compute SVG polyline coordinates
  const points = values
    .map((val, idx) => {
      const x = 15 + (idx / Math.max(values.length - 1, 1)) * 570;
      const y = 135 - ((val - minVal) / range) * 110;
      return `${x},${y}`;
    })
    .join(' ');

  // Compute closed polygon for area gradient fill
  const areaPoints = `15,135 ${points} 585,135`;

  return (
    <div className="trend-card-surface">
      <div className="trend-card-head">
        <div>
          <h4 className="trend-title">{title}</h4>
          <span className="trend-sub">Telemetry window ({readings.length} epochs)</span>
        </div>
        <div className="trend-range-badge">
          <span>Min: {minVal.toFixed(2)}</span>
          <span className="sep">•</span>
          <span>Max: {maxVal.toFixed(2)} {unit}</span>
        </div>
      </div>

      <div className="trend-svg-container">
        <svg viewBox="0 0 600 150" className="hydro-chart-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Guide Lines */}
          <line x1="15" y1="25" x2="585" y2="25" stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1="15" y1="80" x2="585" y2="80" stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1="15" y1="135" x2="585" y2="135" stroke="#cbd5e1" strokeWidth="1" />

          {/* Area Gradient */}
          <polygon points={areaPoints} fill={`url(#${gradientId})`} />

          {/* Curve Stroke */}
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

      <div className="trend-x-axis">
        <span>T - {readings.length * 5}s</span>
        <span>Midpoint Epoch</span>
        <span>T - 0s (Latest)</span>
      </div>
    </div>
  );
}

function ThresholdField({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className="threshold-field-group">
      <div className="field-meta">
        <span className="field-name">{label}</span>
        <span className="field-unit">{unit}</span>
      </div>
      <div className="field-input-wrapper">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (e.target.value !== '' && Number.isFinite(next)) {
              onChange(next);
            }
          }}
          className="threshold-input"
        />
      </div>
    </div>
  );
}

export default function FloodResilience() {
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
    link.download = `ARC_FloodAlert_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const recentReadings = [...readings].slice(-8).reverse();
  const severityClass = (alert?.severity || 'NORMAL').toLowerCase();

  return (
    <div className="hydro-root-container">
      {/* Executive Command Header */}
      <header className="hydro-topbar">
        <div>
          <div className="hydro-brand-tag">
            <span>SIME DARBY PROPERTY</span>
            <span className="dot-divider">•</span>
            <span>DRAINAGE &amp; RETENTION BASIN TELEMETRY</span>
          </div>
          <h1 className="hydro-title">Hydrological Flood Resilience Engine</h1>
          <p className="hydro-desc">
            Surface drainage runoff modeling, predictive retention pond water levels, and automated barrier triggering matrix.
          </p>
        </div>

        <div className="hydro-header-actions">
          <div className="simulation-mode-pill">
            <span className={`live-pulse-dot ${mode === 'dynamic' && autoRefresh ? 'is-pulsing' : ''}`} />
            {mode === 'dynamic' ? 'STREAMING TELEMETRY' : 'STATIC SCENARIO MODEL'}
          </div>
          <span className="hub-id-label">BASIN SENSOR NODE #04-WEST</span>
        </div>
      </header>

      {/* Illustrative Simulation Disclaimer Strip */}
      <div className="hydro-simulation-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          <strong>SIMULATION ENVIRONMENT:</strong> Stream data represents modeled hydrological conditions. Not connected to active municipal stormwater sluice gates or primary emergency alert siren systems.
        </span>
      </div>

      {/* Main Grid: Control Console & Active Sensor Monitor */}
      <div className="hydro-main-grid">
        {/* Left Column: Parameter & Scenario Controller */}
        <aside className="hydro-control-panel">
          <div className="panel-section-head">
            <h3 className="section-title">Telemetry Controller</h3>
            <span className="section-sub">Configure simulated environmental conditions</span>
          </div>

          <div className="control-form">
            <label className="controller-group">
              <span className="controller-label">Simulation Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="hydro-select"
              >
                <option value="scenario">Reproducible Scenario Curve</option>
                <option value="dynamic">Stochastic Dynamic Real-Time</option>
              </select>
            </label>

            <label className="controller-group">
              <span className="controller-label">Weather &amp; Runoff Scenario</span>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                disabled={mode === 'dynamic'}
                className="hydro-select"
              >
                {Object.keys(FLOOD_SCENARIOS).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            {mode === 'dynamic' && (
              <label className="toggle-checkbox-row">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="hydro-checkbox"
                />
                <span className="checkbox-text">Generate epoch pulse every 5 seconds</span>
              </label>
            )}

            <div className="thresholds-section">
              <div className="thresholds-header">
                <span className="thresholds-title">DISPATCH THRESHOLD LIMITS</span>
                <span className="thresholds-badge">CALIBRATION</span>
              </div>

              <div className="threshold-grid">
                <ThresholdField
                  label="Warning Precipitation"
                  value={thresholds.warningRainfall}
                  unit="mm/h"
                  min={1}
                  max={200}
                  step={5}
                  onChange={(v) => updateThreshold('warningRainfall', v)}
                />
                <ThresholdField
                  label="Critical Precipitation"
                  value={thresholds.criticalRainfall}
                  unit="mm/h"
                  min={1}
                  max={300}
                  step={5}
                  onChange={(v) => updateThreshold('criticalRainfall', v)}
                />
                <ThresholdField
                  label="Warning Basin Depth"
                  value={thresholds.warningWater}
                  unit="m"
                  min={0.1}
                  max={2}
                  step={0.05}
                  onChange={(v) => updateThreshold('warningWater', v)}
                />
                <ThresholdField
                  label="Critical Spillover Depth"
                  value={thresholds.criticalWater}
                  unit="m"
                  min={0.1}
                  max={3}
                  step={0.05}
                  onChange={(v) => updateThreshold('criticalWater', v)}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Telemetry KPI Cards & Active Hazard Status */}
        <div className="hydro-telemetry-display">
          <div className="kpi-banner-row">
            <MetricKpiCard
              title="Precipitation Intensity"
              value={latestReading.rainfall_mm_h.toFixed(1)}
              unit="mm/h"
              status={latestReading.rainfall_mm_h >= thresholds.warningRainfall ? 'alert' : 'normal'}
              hint="Optical sensor array"
            />
            <MetricKpiCard
              title="Retention Depth"
              value={latestReading.water_level_m.toFixed(3)}
              unit="m"
              status={latestReading.water_level_m >= thresholds.warningWater ? 'alert' : 'normal'}
              hint="Hydrostatic pressure node"
            />
            <MetricKpiCard
              title="Engine Evaluation"
              value={alert?.severity || 'NORMAL'}
              status={severityClass}
              hint="Evaluated against active thresholds"
            />
          </div>

          {/* Active Hazard Evaluation Banner */}
          {alert && (
            <div className={`hazard-status-card severity-${severityClass}`}>
              <div className="hazard-header-bar">
                <div className="hazard-status-indicator">
                  <span className="status-ping" />
                  <span className="status-heading-text">
                    {alert.severity === 'CRITICAL'
                      ? 'CRITICAL IMMINENT FLOOD HAZARD'
                      : alert.severity === 'WARNING'
                      ? 'PREPAREDNESS & RETENTION WARNING'
                      : 'NORMAL RUNOFF STABILITY'}
                  </span>
                </div>
                <span className="severity-pill">{alert.severity}</span>
              </div>

              <p className="hazard-action-text">{alert.recommended_action}</p>

              {alert.reasons?.length > 0 ? (
                <div className="hazard-triggers">
                  <span className="trigger-label">Active Threshold Triggers:</span>
                  <ul className="trigger-list">
                    {alert.reasons.map((reason, idx) => (
                      <li key={idx} className="trigger-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="hazard-ok-notice">
                  All monitored hydraulic sensor thresholds are resting within nominal design margins.
                </div>
              )}
            </div>
          )}

          {/* Auxiliary Node Status */}
          <div className="aux-metrics-strip">
            <div className="aux-metric-item">
              <span className="aux-label">Peak Window Rainfall</span>
              <span className="aux-value">
                {Math.max(...readings.map((r) => r.rainfall_mm_h)).toFixed(1)} mm/h
              </span>
            </div>
            <div className="aux-metric-item">
              <span className="aux-label">Peak Basin Water Level</span>
              <span className="aux-value">
                {Math.max(...readings.map((r) => r.water_level_m)).toFixed(3)} m
              </span>
            </div>
            <div className="aux-metric-item">
              <span className="aux-label">Retention Inflow Valve</span>
              <span className="aux-value">Standby (Manual Bypass)</span>
            </div>
            <div className="aux-metric-item">
              <span className="aux-label">Submersible Pumps 1-4</span>
              <span className="aux-value status-good">Armed &amp; Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Curves */}
      <section className="hydro-charts-section">
        <div className="section-title-wrap">
          <h3 className="section-heading-main">Hydrological Trend Profiles</h3>
          <span className="section-subtext">Continuous temporal charting across recent observation frames</span>
        </div>

        <div className="charts-double-grid">
          <HydrologicalTrendChart
            title="Precipitation Intensity History"
            readings={readings}
            dataKey="rainfall_mm_h"
            unit="mm/h"
            color="#0284c7"
            gradientId="rainGrad"
          />
          <HydrologicalTrendChart
            title="Basin Water Level Profile"
            readings={readings}
            dataKey="water_level_m"
            unit="m"
            color="#059669"
            gradientId="waterGrad"
          />
        </div>
      </section>

      {/* Historical Telemetry Table & JSON Export */}
      <div className="hydro-data-split">
        {/* Data Log Table */}
        <section className="telemetry-table-card">
          <div className="table-card-header">
            <div>
              <h3 className="table-title">Recent Telemetry Frames</h3>
              <span className="table-sub">Reverse chronological sequence</span>
            </div>
            <span className="data-points-badge">{recentReadings.length} records</span>
          </div>

          <div className="table-wrapper">
            <table className="hydro-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Precipitation (mm/h)</th>
                  <th>Basin Depth (m)</th>
                  <th>Threshold State</th>
                </tr>
              </thead>
              <tbody>
                {recentReadings.map((r) => {
                  const isHigh = r.water_level_m >= thresholds.warningWater;
                  return (
                    <tr key={r.timestamp}>
                      <td className="font-mono">{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                      <td>{r.rainfall_mm_h.toFixed(1)}</td>
                      <td>{r.water_level_m.toFixed(3)}</td>
                      <td>
                        <span className={`table-status-pill ${isHigh ? 'pill-warning' : 'pill-normal'}`}>
                          {isHigh ? 'ELEVATED' : 'NOMINAL'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Structured JSON Payload */}
        <section className="payload-inspect-card">
          <div className="payload-head">
            <div>
              <h3 className="table-title">Structured Alert Object</h3>
              <span className="table-sub">ARC-Shield microservice dispatch standard</span>
            </div>
            <div className="payload-btns">
              <button type="button" className="btn-hydro-ghost" onClick={copyAlertJson}>
                {copiedPayload ? 'Copied' : 'Copy Payload'}
              </button>
              <button type="button" className="btn-hydro-primary" onClick={downloadAlert}>
                Download .JSON
              </button>
            </div>
          </div>

          <pre className="hydro-code-block">
            <code>{JSON.stringify(alert, null, 2)}</code>
          </pre>
        </section>
      </div>

      {/* Protocol Guidance Standard */}
      <footer className="preparedness-footer-card">
        <h4 className="footer-guide-title">Hydraulic Preparedness &amp; Sluice Intervention Protocols</h4>
        <div className="protocols-three-col">
          <div className="protocol-col">
            <span className="protocol-tag tag-normal">CONDITION NORMAL</span>
            <p className="protocol-copy">
              Routine gravity drainage. Facility teams verify retention pond trash screens and culvert headwalls remain free of debris every 72 hours.
            </p>
          </div>
          <div className="protocol-col">
            <span className="protocol-tag tag-warning">CONDITION WARNING</span>
            <p className="protocol-copy">
              Manual inspection of basement sump pits. Standby pumps are placed on automatic float switch triggers. Maintenance teams place flood gates on readiness.
            </p>
          </div>
          <div className="protocol-col">
            <span className="protocol-tag tag-critical">CONDITION CRITICAL</span>
            <p className="protocol-copy">
              Immediate deployment of perimeter modular flood barriers. Alert carpark security to relocate vehicles from lowest subterranean tiers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}