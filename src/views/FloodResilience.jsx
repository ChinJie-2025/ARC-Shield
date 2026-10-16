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

function MetricCard({ title, value, description }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-blue-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function TrendChart({ title, readings, dataKey, unit }) {
  const values = readings.map((reading) => reading[dataKey]);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;

  const points = values
    .map((value, index) => {
      const x = 12 + (index / Math.max(values.length - 1, 1)) * 576;
      const y = 130 - ((value - minimum) / range) * 108;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 font-bold text-slate-800">{title}</h3>
      <p className="mb-3 text-xs text-slate-500">
        {minimum.toFixed(3)} to {maximum.toFixed(3)} {unit}
      </p>

      <svg
        viewBox="0 0 600 150"
        role="img"
        aria-label={`${title} trend over ${readings.length} simulated readings`}
        className="w-full"
      >
        <line
          x1="12"
          y1="130"
          x2="588"
          y2="130"
          stroke="#cbd5e1"
          strokeWidth="1"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <div className="flex justify-between text-xs text-slate-500">
        <span>Oldest</span>
        <span>Latest</span>
      </div>
    </div>
  );
}

function ThresholdInput({ label, value, min, max, step, onChange }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (event.target.value !== '' && Number.isFinite(nextValue)) {
            onChange(nextValue);
          }
        }}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
      />
      </label>
  );
}

export default function FloodResilience() {
  const [mode, setMode] = useState('scenario');
  const [scenario, setScenario] = useState('Normal conditions');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [thresholds, setThresholds] = useState(
    DEFAULT_FLOOD_THRESHOLDS,
  );

  const [readings, setReadings] = useState(() =>
    createScenarioReadings('Normal conditions'),
  );

  // Load a fresh scenario or start a new dynamic simulation when
  // the selected mode or reproducible scenario changes.
  useEffect(() => {
    if (mode === 'scenario') {
      setReadings(createScenarioReadings(scenario));
    } else {
      setReadings([generateDynamicReading()]);
    }
  }, [mode, scenario]);

  // Generate dynamic readings every five seconds only when enabled.
  // The interval is cleaned up when the mode changes or this screen unmounts.
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

  const latestReading = readings[readings.length - 1];

  const alert = useMemo(() => {
    if (!latestReading) {
      return null;
    }

    return evaluateFloodReading(
      latestReading.rainfall_mm_h,
      latestReading.water_level_m,
      thresholds,
    );
  }, [latestReading, thresholds]);

  const statusStyles = {
    NORMAL: 'bg-green-50 border-green-200 text-green-800',
    WARNING: 'bg-amber-50 border-amber-300 text-amber-900',
    CRITICAL: 'bg-red-50 border-red-300 text-red-900',
  };

  const updateThreshold = (key, value) => {
    setThresholds((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const downloadAlert = () => {
    if (!alert) return;

    const json = JSON.stringify(alert, null, 2);
    const blob = new Blob([json], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'floodwatch_alert.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const recentReadings = [...readings].slice(-10).reverse();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-blue-900">
          Flood Resilience & Preparedness
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Explore simulated rainfall and water-level conditions and review
          threshold-based alerts.
        </p>
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <strong>SIMULATION ONLY:</strong> All readings and alerts are
          illustrative. This prototype is not connected to real sensors,
          weather forecasts, pumps, or emergency notification systems.
        </div>
      </div>

      {/* Simulation controls */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="border-b pb-3 text-lg font-bold">
            Simulation Controls
          </h3>

          <label className="block text-sm font-medium text-slate-700">
            Simulation mode
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2"
            >
              <option value="scenario">Reproducible scenario</option>
              <option value="dynamic">Dynamic simulation</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Flood scenario
            <select
              value={scenario}
              onChange={(event) => setScenario(event.target.value)}
              disabled={mode === 'dynamic'}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 disabled:bg-slate-100"
            >
              {Object.keys(FLOOD_SCENARIOS).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          {mode === 'dynamic' && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                className="h-4 w-4"
              />
              Generate a new reading every 5 seconds
            </label>
          )}

          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            {mode === 'scenario'
              ? 'The selected scenario contains 24 reproducible hourly readings.'
              : autoRefresh
                ? 'Dynamic readings are generated every 5 seconds while this screen is active.'
                : 'Auto-refresh is paused. Existing readings remain available.'}
          </div>

          <div>
            <h4 className="mb-3 font-bold text-slate-800">
              Alert Thresholds
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ThresholdInput
                label="Warning rainfall (mm/h)"
                value={thresholds.warningRainfall}
                min={1}
                max={200}
                step={5}
                onChange={(value) =>
                  updateThreshold('warningRainfall', value)
                }
              />
              <ThresholdInput
                label="Critical rainfall (mm/h)"
                value={thresholds.criticalRainfall}
                min={1}
                max={300}
                step={5}
                onChange={(value) =>
                  updateThreshold('criticalRainfall', value)
                }
              />
              <ThresholdInput
                label="Warning water (m)"
                value={thresholds.warningWater}
                min={0.1}
                max={2}
                step={0.05}
                onChange={(value) =>
                  updateThreshold('warningWater', value)
                }
              />
              <ThresholdInput
                label="Critical water (m)"
                value={thresholds.criticalWater}
                min={0.1}
                max={3}
                step={0.05}
                onChange={(value) =>
                  updateThreshold('criticalWater', value)
                }
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              These are configurable demo thresholds, not verified flood
              safety limits.
            </p>
          </div>
        </div>

        {/* Current telemetry */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              title="Rainfall Intensity"
              value={`${latestReading.rainfall_mm_h.toFixed(1)} mm/h`}
              description="Latest simulated reading"
            />
            <MetricCard
              title="Water Level"
              value={`${latestReading.water_level_m.toFixed(3)} m`}
              description="Latest simulated water level"
            />
            <MetricCard
              title="Alert Severity"
              value={alert.severity}
              description="Based on current demo thresholds"
            />
          </div>

          <div
            className={`rounded-lg border p-5 ${
              statusStyles[alert.severity]
            }`}
          >
            <h3 className="text-lg font-bold">
              {alert.severity === 'CRITICAL'
                ? 'Critical Demo Alert'
                : alert.severity === 'WARNING'
                  ? 'Preparedness Alert'
                  : 'Normal Demo Conditions'}
            </h3>

            <p className="mt-2">{alert.recommended_action}</p>

            {alert.reasons.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {alert.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm">
                No configured demo thresholds have been reached.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard
              title="Peak Simulated Rainfall"
              value={`${Math.max(
                ...readings.map((reading) => reading.rainfall_mm_h),
              ).toFixed(1)} mm/h`}
              description="Highest reading in the displayed history"
            />
            <MetricCard
              title="Pump Connection"
              value="Not connected"
              description="No physical pump control or telemetry is available"
            />
          </div>
        </div>
      </section>

      {/* Telemetry charts */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-blue-900">
          Simulated Telemetry Trends
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TrendChart
            title="Rainfall Intensity"
            readings={readings}
            dataKey="rainfall_mm_h"
            unit="mm/h"
          />
          <TrendChart
            title="Water Level"
            readings={readings}
            dataKey="water_level_m"
            unit="m"
          />
        </div>
      </section>

      {/* Recent telemetry */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h3 className="text-lg font-bold text-blue-900">
              Recent Telemetry
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Latest {recentReadings.length} readings, newest first
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Simulated data
          </span>
        </div>

         <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Rainfall (mm/h)</th>
                <th className="px-4 py-3">Water Level (m)</th>
              </tr>
            </thead>
            <tbody>
              {recentReadings.map((reading) => (
                <tr
                  key={reading.timestamp}
                  className="border-t border-slate-100"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(reading.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {reading.rainfall_mm_h.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    {reading.water_level_m.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Alert JSON */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-blue-900">
              Structured Alert Output
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              JSON payload for future integration with the ARC-Shield backend.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadAlert}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Download Alert JSON
          </button>
        </div>

        <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-4 text-xs text-green-300">
          {JSON.stringify(alert, null, 2)}
        </pre>
      </section>

      {/* Preparedness guidance */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-blue-900">
          Preparedness Guidance
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Illustrative suggestions only. Follow the property's approved
          procedures and guidance from the appropriate authorities.
        </p>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            <strong>Normal:</strong> Continue monitoring simulated readings
            and follow the established inspection schedule.
          </li>
          <li>
            <strong>Warning:</strong> Consider having an authorized person
            inspect flood barriers and review backup arrangements.
          </li>
          <li>
            <strong>Critical:</strong> Urgently review conditions and follow
            the property's established response procedure.
          </li>
        </ul>
      </section>
    </div>
  );
}
