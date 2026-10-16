
export const DEFAULT_FLOOD_THRESHOLDS = {
  warningRainfall: 40,
  criticalRainfall: 80,
  warningWater: 0.75,
  criticalWater: 1.0,
};

export function evaluateFloodReading(
  rainfallMmH,
  waterLevelM,
  thresholds = DEFAULT_FLOOD_THRESHOLDS,
  now = new Date(),
) {
  const reasons = [];

  // Check critical thresholds first, matching the Python simulator.
  if (rainfallMmH >= thresholds.criticalRainfall) {
    reasons.push("Rainfall reached the critical demo threshold.");
  }

  if (waterLevelM >= thresholds.criticalWater) {
    reasons.push("Water level reached the critical demo threshold.");
  }

  let severity;

  if (reasons.length > 0) {
    severity = "CRITICAL";
  } else {
    if (rainfallMmH >= thresholds.warningRainfall) {
      reasons.push("Rainfall reached the warning demo threshold.");
    }

    if (waterLevelM >= thresholds.warningWater) {
      reasons.push("Water level reached the warning demo threshold.");
    }

    severity = reasons.length > 0 ? "WARNING" : "NORMAL";
  }

  const recommendedActions = {
    NORMAL:
      "Readings are below the configured alert thresholds.",
    WARNING:
      "Review the readings and consider a site inspection.",
    CRITICAL:
      "Urgently review conditions and follow the property's established response procedure.",
  };

  const timestamp = now.toISOString();
  const compactTimestamp = timestamp
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

  return {
    alert_id: `FLOOD-DEMO-${compactTimestamp}`,
    source: "FloodWatchSimulator",
    simulated: true,
    severity,
    rainfall_mm_h: Math.round(rainfallMmH * 10) / 10,
    water_level_m: Math.round(waterLevelM * 1000) / 1000,
    reasons,
    recommended_action: recommendedActions[severity],
    generated_at: timestamp,
  };
}
