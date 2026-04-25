// Country Cycles Killearn — KEEF Diagnostic Engine (web port)
// Safety escalation rules and bike-type modifiers.

const TIER_ORDER = { GREEN: 0, AMBER: 1, RED: 2 };

export function maxTier(a, b) {
  return TIER_ORDER[a] >= TIER_ORDER[b] ? a : b;
}

export const BIKE_TYPE_MODIFIERS = {
  KIDS:   { riskMultiplier: 1.4, forceMinTierOn: { BRAKES: 'AMBER', TYRES_WHEELS: 'AMBER', HEADSET_STEERING: 'RED' } },
  EBIKE:  { riskMultiplier: 1.1, forceMinTierOn: { EBIKE_ELECTRICS: 'AMBER' } },
  ROAD:   { riskMultiplier: 1.0 },
  MTB:    { riskMultiplier: 1.0 },
  GRAVEL: { riskMultiplier: 1.0 },
  HYBRID: { riskMultiplier: 1.1 },
};

export const SAFETY_CRITICAL_CATEGORIES = ['BRAKES', 'HEADSET_STEERING', 'EBIKE_ELECTRICS'];

export const RISK_THRESHOLDS = {
  GREEN_MAX: 25,
  AMBER_MAX: 70,
};

export function tierFromScore(score) {
  if (score <= RISK_THRESHOLDS.GREEN_MAX) return 'GREEN';
  if (score <= RISK_THRESHOLDS.AMBER_MAX) return 'AMBER';
  return 'RED';
}

export const HARD_RED_FLAGS = [
  { id: 'CRASH_UNRESOLVED', prompt: 'Has the bike been in a crash or had a hard knock, and something has felt different since?', templateId: 'RED_RECENT_CRASH_UNRESOLVED' },
  { id: 'VISIBLE_CRACK', prompt: 'Can you see a crack in the frame, fork, bars, stem, seatpost, or rim?', templateId: 'RED_FRAME_CARBON_CRACK' },
  { id: 'PRESSURE_WASHED', prompt: 'Has the bike been pressure-washed, and now you have an electrical or bearing symptom?', templateId: 'RED_EBIKE_WATER_INGRESS' },
];
