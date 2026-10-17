const TEAM_ROUTING = {
  Low: ['Security', 'Entry-level Management', 'SHO'],
  Moderate: ['Security', 'Entry-level Management', 'Mid-level Management', 'SHO'],
  High: ['Security', 'Entry and Mid-level Management', 'SHO', 'Head of HSSE'],
  Critical: ['Security', 'Entry and Mid-level Management', 'MERS 999', 'SHO', 'Head of HSSE'],
};

const profiles = {
  Low: { interveneMinutes: 4 * 60, settleMinutes: 24 * 60, sla: 'Intervene within 4 hours; settle within 4-24 hours', priority: 4, escalateMinutes: null },
  Moderate: { interveneMinutes: 72 * 60, settleMinutes: 72 * 60, sla: 'Respond/settle within 72 hours', priority: 3, escalateMinutes: null },
  ModerateWater: { interveneMinutes: 15, settleMinutes: 15, sla: 'Respond to water level issue within 15 minutes', priority: 2, escalateMinutes: null },
  High: { interveneMinutes: 30, settleMinutes: 0, sla: 'Intervene within 30 minutes; settle ASAP', priority: 2, escalateMinutes: 30 },
  HighFlood: { interveneMinutes: 15, settleMinutes: 0, sla: 'Potential flood: intervene within 15 minutes; settle ASAP', priority: 2, escalateMinutes: 15 },
  Critical: { interveneMinutes: 5, settleMinutes: 0, sla: 'Respond and settle ASAP; executive escalation at 5 minutes', priority: 1, escalateMinutes: 5 },
};

export function classifyIncident(description = '') {
  const text = description.toLowerCase();
  let risk = 'Low';
  let profile = profiles.Low;
  let reason = 'General safety concern or small, movable obstruction.';

  if (/confirmed fire|fire hazard|burning|smoke|flame|active fire|active flood|flooding|building is flooding|water entering/.test(text)) {
    risk = 'Critical';
    profile = profiles.Critical;
    reason = 'Possible active fire or flooding requires immediate response.';
  } else if (/potential flood|flood risk|rising water|blocked canal|canal blocked|flood|emergency exit.*(locked|blocked)|locked emergency exit|exit.*locked/.test(text)) {
    risk = 'High';
    profile = profiles.HighFlood;
    reason = 'Potential flood, blocked canal, or blocked/locked emergency exit.';
  } else if (/abnormal water|water level|water pooling|water around|water leak|leak|flood/.test(text)) {
    risk = 'Moderate';
    profile = profiles.ModerateWater;
    reason = 'Water level issue has a 15-minute response target.';
  } else if (/heavy|large|blocked exit|obstructed exit|extinguisher|fire extinguisher|lift|elevator|escalator|accessibility|serious/.test(text)) {
    risk = 'Moderate';
    profile = profiles.Moderate;
    reason = 'Serious safety issue, heavy obstruction, extinguisher, lift, or accessibility concern.';
  }

  return {
    risk,
    reason,
    priority: profile.priority,
    teams: TEAM_ROUTING[risk],
    sla: profile.sla,
    interveneMinutes: profile.interveneMinutes,
    settleMinutes: profile.settleMinutes,
    escalateMinutes: profile.escalateMinutes,
    escalationTarget: risk === 'Critical' || risk === 'High' ? 'C-level / Executive' : null,
  };
}

