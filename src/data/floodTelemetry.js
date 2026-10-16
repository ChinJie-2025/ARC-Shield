
import { FLOOD_SCENARIOS } from "./floodScenarios";

const randomInteger = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const roundTo = (value, decimalPlaces) => {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/**
 * Convert a reproducible scenario into 24 hourly readings.
 * The latest reading is timestamped at the current hour.
 */
export function createScenarioReadings(scenarioName, now = new Date()) {
  const scenario = FLOOD_SCENARIOS[scenarioName];

  if (!scenario) {
    throw new Error(`Unknown flood scenario: ${scenarioName}`);
  }

  const currentHour = new Date(now);
  currentHour.setMinutes(0, 0, 0);

  return scenario.rainfall.map((rainfall, index) => {
    const timestamp = new Date(currentHour);
    timestamp.setHours(currentHour.getHours() - (23 - index));

    return {
      timestamp: timestamp.toISOString(),
      rainfall_mm_h: rainfall,
      water_level_m: scenario.waterLevel[index],
    };
  });
}

/**
 * Generate one illustrative dynamic reading.
 * Pass the previous reading to continue its simulated trend.
 */
export function generateDynamicReading(
  previous = null,
  now = new Date(),
) {
  let waterLevel = previous?.water_level_m ?? 0.30;
  let rainfall = previous?.rainfall_mm_h ?? 3.0;
  let trend = previous?.trend ?? 1;

  // Occasionally change the simulated trend.
  if (Math.random() < 0.12) {
    const possibleTrends = [-1, 0, 1, 1];
    trend = possibleTrends[
      randomInteger(0, possibleTrends.length - 1)
    ];
  }

  if (trend === 1) {
    rainfall += randomInteger(2, 12);
    waterLevel += 0.005 + Math.random() * 0.040;
  } else if (trend === -1) {
    rainfall -= randomInteger(2, 10);
    waterLevel -= 0.005 + Math.random() * 0.020;
  } else {
    rainfall += randomInteger(-3, 3);
    waterLevel += -0.008 + Math.random() * 0.020;
  }

  rainfall = Math.max(0, Math.min(100, rainfall));
  waterLevel = Math.max(0.1, Math.min(1.5, waterLevel));

  return {
    timestamp: now.toISOString(),
    rainfall_mm_h: roundTo(rainfall, 1),
    water_level_m: roundTo(waterLevel, 3),
    trend,
  };
}

/**
 * Keep only the newest 30 readings.
 */
export function keepLatestReadings(readings, limit = 30) {
  return [...readings]
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime(),
    )
    .slice(-limit);
}
