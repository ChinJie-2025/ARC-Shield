const TEAM_ROUTING = {
  Low: ['Security', 'Entry-level Management', 'SHOs'],
  Moderate: ['Security', 'Entry-level Management', 'Mid-level Management', 'SHOs'],
  High: ['Security', 'Entry and Mid-level Management', 'SHOs', 'Head of HSSE', 'C-level if intervention SLA is missed'],
  Critical: ['Security', 'Entry and Mid-level Management', 'MERS 999', 'SHOs', 'Head of HSSE', 'C-level if intervention is not started within 5 minutes'],
};

const profiles = {
  Unclear: {
    priority: null,
    interveneMinutes: null,
    settleMinutes: null,
    escalateMinutes: null,
    sla: 'Set after an operator identifies the hazard',
  },
  Low: { interveneMinutes: 4 * 60, settleMinutes: 24 * 60, sla: 'Intervene within 4 hours; settle within 4-24 hours', priority: 4, escalateMinutes: 24 * 60 },
  Moderate: { interveneMinutes: 72 * 60, settleMinutes: 72 * 60, sla: 'Respond/settle within 72 hours', priority: 3, escalateMinutes: 72 * 60 },
  ModerateWater: { interveneMinutes: 15, settleMinutes: 15, sla: 'Respond to water level issue within 15 minutes', priority: 2, escalateMinutes: 15 },
  High: { interveneMinutes: 30, settleMinutes: 0, sla: 'Intervene within 30 minutes; settle ASAP', priority: 2, escalateMinutes: 30 },
  HighFlood: { interveneMinutes: 15, settleMinutes: 0, sla: 'Potential flood: intervene within 15 minutes; settle ASAP', priority: 2, escalateMinutes: 15 },
  Critical: { interveneMinutes: 5, settleMinutes: 0, sla: 'Respond and settle ASAP; executive escalation at 5 minutes', priority: 1, escalateMinutes: 5 },
};

const rules = [
  {
    risk: 'Critical',
    profile: profiles.Critical,
    reason: 'Possible immediate threat to life or major property damage; contact emergency services and notify the duty team.',
    pattern: /\b((confirmed|active|possible) fire|fire (started|in|at|inside|near|hazard)|visible smoke|smoke (detected|in|coming|from)|flames?|burning|gas leak|gas smell|carbon monoxide|structural collapse|building collapse|electrocution|person trapped|person unconscious|active flooding|water entering (the )?building|building (is )?flooding|rapidly rising water)\b/i,
  },
  {
    risk: 'High',
    profile: profiles.HighFlood,
    reason: 'A potential flood hazard needs prompt on-site assessment.',
    pattern: /\b(rising water|flood risk|potential flood|blocked canal|canal blocked)\b/i,
  },
  {
    risk: 'High',
    profile: profiles.High,
    reason: 'A serious access, electrical, or structural hazard needs prompt on-site assessment.',
    pattern: /\b(blocked|locked)\s+(emergency\s+|fire\s+)?exit\b|\b(exit|fire exit|emergency exit)\s+(is\s+)?(blocked|locked)\b|\b(exposed live wire|live wire|sparking wire|electrical sparks|power line down|lift trapped|elevator trapped|person stuck in lift|serious structural crack)\b/i,
  },
  {
    risk: 'Moderate',
    profile: profiles.ModerateWater,
    reason: 'A maintenance or water issue was recognized and should be checked by the facility team.',
    pattern: /\b(water leak|leaking pipe|pipe leak|water pooling|water puddle|puddle on|wet floor|water around|abnormal water|water level|blocked drain|drain blocked|flickering light|broken light|light not working|loose handrail|trip hazard|broken glass|damaged door|lift not working|elevator not working|escalator stopped|fire extinguisher missing|heavy obstruction|large obstruction|accessibility issue)\b/i,
  },
  {
    risk: 'Moderate',
    profile: profiles.Moderate,
    reason: 'A maintenance or accessibility concern was recognized and should be checked by the facility team.',
    pattern: /\b(routine maintenance|maintenance issue|damaged railing|damaged stair|damaged ceiling|ceiling tile loose|door closer broken|broken handrail|pest infestation|sanitation issue|minor electrical fault|emergency light not working)\b/i,
  },
  {
    risk: 'Low',
    profile: profiles.Low,
    reason: 'A minor housekeeping or movable obstruction issue was recognized; routine follow-up is appropriate.',
    pattern: /\b(litter|trash|rubbish|small movable obstruction|minor obstruction|minor debris|minor spill|routine cleaning|housekeeping issue|non urgent maintenance|non-urgent maintenance)\b/i,
  },
];

export function classifyIncident(description = '') {
  const text = String(description).trim();
  if (!text) {
    return {
      risk: 'Unclear',
      isRecognized: false,
      reason: 'Describe the visible hazard, where it is, and whether anyone is in immediate danger.',
      teams: [],
      ...profiles.Unclear,
      escalationTarget: null,
    };
  }

  const rule = rules.find((candidate) => candidate.pattern.test(text));
  if (!rule) {
    return {
      risk: 'Unclear',
      isRecognized: false,
      reason: 'No known hazard keyword matched. Describe the specific safety issue and its visible impact; an operator must set its priority.',
      teams: [],
      ...profiles.Unclear,
      escalationTarget: null,
    };
  }

  return {
    risk: rule.risk,
    isRecognized: true,
    reason: rule.reason,
    teams: TEAM_ROUTING[rule.risk],
    ...rule.profile,
    escalationTarget: 'Executive',
  };
}
