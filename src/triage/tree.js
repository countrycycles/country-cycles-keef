// Country Cycles Killearn — KEEF Diagnostic Engine (web port)
// The triage question tree.

const NOT_SURE_TO_AMBER = {
  id: 'not_sure',
  label: "I'm not sure",
  riskDelta: 25,
  result: { tier: 'AMBER', templateId: 'AMBER_NOT_SURE', reason: 'user-not-sure' },
};

export const ENTRY_QUESTION_ID = 'BOOT_01_BIKE_TYPE';

export const CATEGORY_ENTRY_IDS = {
  BRAKES: 'BRAKES_01', GEARS: 'GEARS_01', CHAIN: 'CHAIN_01',
  TYRES_WHEELS: 'TW_01', HEADSET_STEERING: 'HS_01', CRANKS_BB: 'CBB_01',
  SUSPENSION: 'SUS_01', EBIKE_ELECTRICS: 'EBE_01', OTHER: 'OTHER_01',
  KIDS_SIZING: 'KIDS_SIZING_01',
};

export const QUESTIONS = {
  // ---------- BOOTSTRAP ----------
  BOOT_01_BIKE_TYPE: {
    id: 'BOOT_01_BIKE_TYPE', category: 'BOOTSTRAP', keefPose: 'wave',
    text: "Right, what's the bike doing? First — what kind of bike is it?",
    options: [
      { id: 'EBIKE',  label: 'E-bike',          next: 'BOOT_02_SYMPTOM_AREA' },
      { id: 'ROAD',   label: 'Road bike',       next: 'BOOT_02_SYMPTOM_AREA' },
      { id: 'MTB',    label: 'Mountain bike',   next: 'BOOT_02_SYMPTOM_AREA' },
      { id: 'GRAVEL', label: 'Gravel bike',     next: 'BOOT_02_SYMPTOM_AREA' },
      { id: 'HYBRID', label: 'Hybrid',          next: 'BOOT_02_SYMPTOM_AREA' },
      { id: 'KIDS',   label: "Kids' bike",      next: 'BOOT_02_SYMPTOM_AREA' },
    ],
  },
  BOOT_02_SYMPTOM_AREA: {
    id: 'BOOT_02_SYMPTOM_AREA', category: 'BOOTSTRAP', keefPose: 'tablet',
    text: 'Aye. Whereabouts is the trouble?',
    helpText: 'Pick the area that best matches what you have noticed.',
    options: [
      { id: 'brakes',       label: 'Brakes',                              next: 'BRAKES_01' },
      { id: 'gears',        label: 'Gears or shifting',                   next: 'GEARS_01' },
      { id: 'chain',        label: 'Chain or drivetrain',                 next: 'CHAIN_01' },
      { id: 'tyres_wheels', label: 'Tyres or wheels',                     next: 'TW_01' },
      { id: 'headset',      label: 'Steering, bars, or headset',          next: 'HS_01' },
      { id: 'cranks',       label: 'Cranks or pedalling area',            next: 'CBB_01' },
      { id: 'suspension',   label: 'Suspension or dropper post',          next: 'SUS_01' },
      { id: 'ebike',        label: 'Battery, motor, or display',          next: 'EBE_01' },
      { id: 'kids_sizing',  label: 'Bike seems too small or outgrown',    next: 'KIDS_SIZING_01' },
      { id: 'other',        label: 'Something else / not sure',           next: 'OTHER_01' },
    ],
  },

  // ---------- BRAKES ----------
  BRAKES_01: {
    id: 'BRAKES_01', category: 'BRAKES', keefPose: 'magnify',
    text: 'How are the brakes behaving?',
    options: [
      { id: 'lever_to_bar', label: 'Lever pulls all the way to the bar', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_BRAKES_LEVER_TO_BAR', reason: 'lever-to-bar' } },
      { id: 'fluid_visible', label: 'I can see fluid or oil where it should not be', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_BRAKES_HYDRAULIC_LEAK', reason: 'fluid-visible' } },
      { id: 'snapped_cable', label: 'A brake cable has snapped', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_BRAKES_SNAPPED_CABLE', reason: 'snapped-cable' } },
      { id: 'rubbing', label: 'Rubbing or scraping noise', riskDelta: 15, next: 'BRAKES_02' },
      { id: 'weak', label: 'Brake is weak but lever feels firm', riskDelta: 35, next: 'BRAKES_05' },
      { id: 'gritty_cable', label: 'Cable brake feels gritty or slow', riskDelta: 30, next: 'BRAKES_07' },
      NOT_SURE_TO_AMBER,
    ],
  },
  BRAKES_02: {
    id: 'BRAKES_02', category: 'BRAKES', keefPose: 'magnify',
    text: 'Has the wheel been removed or refitted recently — including loading the bike on a car or train?',
    options: [
      { id: 'yes', label: 'Yes', riskDelta: 0, next: 'BRAKES_03' },
      { id: 'no', label: 'No', riskDelta: 10, next: 'BRAKES_04' },
      { id: 'not_sure', label: 'Not sure', riskDelta: 15, next: 'BRAKES_04' },
    ],
  },
  BRAKES_03: {
    id: 'BRAKES_03', category: 'BRAKES', keefPose: 'magnify',
    text: 'Open the quick-release or thru-axle, drop the wheel back in straight against the dropouts, close it firm. Spin the wheel — has the rub gone?',
    helpText: "If you don't feel comfortable doing this, that's fine — pick the third option.",
    options: [
      { id: 'gone', label: 'Aye, sorted', riskDelta: -10,
        result: { tier: 'GREEN', templateId: 'GREEN_BRAKES_WHEEL_RESEAT', reason: 'wheel-reseat-fix' } },
      { id: 'still_rubs', label: 'Still rubbing', riskDelta: 20, next: 'BRAKES_04' },
      { id: 'wont_attempt', label: 'Would rather not try', riskDelta: 25,
        result: { tier: 'AMBER', templateId: 'AMBER_BRAKES_CALIPER_ALIGN', reason: 'user-prefers-workshop' } },
    ],
  },
  BRAKES_04: {
    id: 'BRAKES_04', category: 'BRAKES', keefPose: 'magnify',
    text: 'Is the brake still stopping the bike normally?',
    options: [
      { id: 'yes', label: "Yes, just rubs but it's stopping fine", riskDelta: 10,
        result: { tier: 'AMBER', templateId: 'AMBER_BRAKES_CALIPER_ALIGN', reason: 'rub-only' } },
      { id: 'weak_too', label: 'No, also weak', riskDelta: 50, next: 'BRAKES_05' },
      { id: 'burning', label: "There's a burning smell or vibration when I brake", riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_BRAKES_ROTOR_BURN', reason: 'rotor-burn' } },
    ],
  },
  BRAKES_05: {
    id: 'BRAKES_05', category: 'BRAKES', keefPose: 'magnify',
    text: 'Hydraulic brakes (no visible cable to the lever) or cable brakes?',
    helpText: "If you're not sure, pick 'Not sure' — we'd rather see it than guess.",
    options: [
      { id: 'hydraulic', label: 'Hydraulic', riskDelta: 20, next: 'BRAKES_06' },
      { id: 'cable', label: 'Cable', riskDelta: 10, next: 'BRAKES_07' },
      { id: 'not_sure', label: 'Not sure', riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_BRAKES_PADS_OR_CABLE', reason: 'unknown-brake-type' } },
    ],
  },
  BRAKES_06: {
    id: 'BRAKES_06', category: 'BRAKES', keefPose: 'magnify',
    text: 'Any oil or fluid you can see on the rotor, the pads, or anywhere it should not be?',
    options: [
      { id: 'yes', label: 'Yes', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_BRAKES_CONTAMINATED', reason: 'contaminated-pads' } },
      { id: 'no', label: 'No, but the lever feels spongy or the brake is weak', riskDelta: 60,
        result: { tier: 'AMBER', templateId: 'AMBER_BRAKES_PADS_OR_CABLE', reason: 'hydraulic-spongy' } },
    ],
  },
  BRAKES_07: {
    id: 'BRAKES_07', category: 'BRAKES', keefPose: 'magnify',
    text: 'Look at the cable where it enters the lever and where it bolts to the brake. Any visible fraying or kinks?',
    options: [
      { id: 'frayed', label: 'Some fraying', riskDelta: 50,
        result: { tier: 'AMBER', templateId: 'AMBER_BRAKES_PADS_OR_CABLE', reason: 'cable-fraying' } },
      { id: 'snapped', label: 'Looks snapped or close to it', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_BRAKES_SNAPPED_CABLE', reason: 'cable-snapped-imminent' } },
      { id: 'no_damage', label: 'No visible damage', riskDelta: 35,
        result: { tier: 'AMBER', templateId: 'AMBER_BRAKES_PADS_OR_CABLE', reason: 'cable-tension' } },
    ],
  },

  // ---------- GEARS ----------
  GEARS_01: {
    id: 'GEARS_01', category: 'GEARS', keefPose: 'magnify',
    text: "What's happening with the gears?",
    options: [
      { id: 'skip_load', label: 'Skipping under load (climbing, pushing hard)', riskDelta: 35, next: 'GEARS_02' },
      { id: 'sluggish', label: 'Slow or sluggish to shift', riskDelta: 20, next: 'GEARS_03' },
      { id: 'one_cog', label: 'Skips on one specific gear only', riskDelta: 25, next: 'GEARS_04' },
      { id: 'rub_front', label: 'Chain rubs the front mech', riskDelta: 15, next: 'GEARS_05' },
      { id: 'no_response', label: 'Shifter does nothing', riskDelta: 30, next: 'GEARS_06' },
      { id: 'mech_bent', label: 'Rear mech looks bent or hanging at an angle', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_GEARS_BENT_DERAILLEUR', reason: 'bent-mech' } },
      NOT_SURE_TO_AMBER,
    ],
  },
  GEARS_02: {
    id: 'GEARS_02', category: 'GEARS', keefPose: 'magnify',
    text: 'Has the bike been in a crash, or fallen on the drive (gear) side?',
    options: [
      { id: 'yes', label: 'Yes', riskDelta: 50,
        result: { tier: 'AMBER', templateId: 'AMBER_GEARS_HANGER_SUSPECT', reason: 'crash-hanger-suspect' } },
      { id: 'no', label: 'No', riskDelta: 0, next: 'GEARS_07' },
    ],
  },
  GEARS_03: {
    id: 'GEARS_03', category: 'GEARS', keefPose: 'magnify',
    text: 'Is the bike new — under 200 km / 125 miles since you got it?',
    options: [
      { id: 'yes', label: 'Yes, fairly new', riskDelta: -5,
        result: { tier: 'GREEN', templateId: 'GREEN_GEARS_NEW_CABLE_BEDDING', reason: 'new-cable-bedding' } },
      { id: 'no', label: 'No, older', riskDelta: 15,
        result: { tier: 'AMBER', templateId: 'AMBER_GEARS_INDEX', reason: 'index-drift' } },
    ],
  },
  GEARS_04: {
    id: 'GEARS_04', category: 'GEARS', keefPose: 'magnify',
    text: 'Does it skip on that one cog under load, or is it just hesitant to shift into it?',
    options: [
      { id: 'skip', label: 'Skips under load', riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_GEARS_INDEX', reason: 'one-cog-skip' } },
      { id: 'hesitant', label: 'Just hesitant', riskDelta: 15,
        result: { tier: 'AMBER', templateId: 'AMBER_GEARS_INDEX', reason: 'one-cog-hesitant' } },
    ],
  },
  GEARS_05: {
    id: 'GEARS_05', category: 'GEARS', keefPose: 'magnify',
    text: 'Does it only rub when you are in the biggest cog with the big chainring, or the smallest cog with the wee chainring?',
    options: [
      { id: 'extreme', label: 'Yes, only in those gear combos', riskDelta: -5,
        result: { tier: 'GREEN', templateId: 'GREEN_GEARS_CROSS_CHAINING', reason: 'cross-chain' } },
      { id: 'normal', label: 'No, also in normal gears', riskDelta: 25,
        result: { tier: 'AMBER', templateId: 'AMBER_GEARS_INDEX', reason: 'fd-trim' } },
    ],
  },
  GEARS_06: {
    id: 'GEARS_06', category: 'GEARS', keefPose: 'magnify',
    text: 'Is it electronic shifting — Di2, AXS, or EPS?',
    options: [
      { id: 'yes', label: 'Yes, electronic', riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_GEARS_ELECTRONIC', reason: 'electronic-shift' } },
      { id: 'no', label: 'No, mechanical', riskDelta: 35,
        result: { tier: 'AMBER', templateId: 'AMBER_GEARS_INDEX', reason: 'mechanical-no-response' } },
    ],
  },
  GEARS_07: {
    id: 'GEARS_07', category: 'GEARS', keefPose: 'magnify',
    text: 'Look at the rear mech from behind. Does it sit straight, or look twisted toward the wheel?',
    options: [
      { id: 'twisted', label: 'Twisted toward the wheel', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_GEARS_BENT_DERAILLEUR', reason: 'visible-bend' } },
      { id: 'straight', label: 'Looks straight', riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_GEARS_DRIVETRAIN_WORN', reason: 'all-cogs-skip' } },
      NOT_SURE_TO_AMBER,
    ],
  },

  // ---------- CHAIN ----------
  CHAIN_01: {
    id: 'CHAIN_01', category: 'CHAIN', keefPose: 'magnify',
    text: "What's the chain doing?",
    options: [
      { id: 'snapped', label: 'Snapped', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_CHAIN_BROKEN', reason: 'chain-broken' } },
      { id: 'dropped', label: 'Came off the chainring', riskDelta: 15, next: 'CHAIN_02' },
      { id: 'stiff_link', label: 'Pulses or jumps once per chain rotation', riskDelta: 20, next: 'CHAIN_03' },
      { id: 'creak', label: 'Creak or click while pedalling', riskDelta: 25, next: 'CHAIN_04' },
      { id: 'rust', label: 'Visibly rusty or seized', riskDelta: 35,
        result: { tier: 'AMBER', templateId: 'AMBER_CHAIN_WORN', reason: 'rust' } },
      NOT_SURE_TO_AMBER,
    ],
  },
  CHAIN_02: {
    id: 'CHAIN_02', category: 'CHAIN', keefPose: 'magnify',
    text: 'Was that a one-off, or is it dropping repeatedly?',
    options: [
      { id: 'oneoff', label: 'One-off after a heavy shift', riskDelta: -5,
        result: { tier: 'GREEN', templateId: 'GREEN_CHAIN_DROP_ONEOFF', reason: 'one-off-drop' } },
      { id: 'repeated', label: 'Repeatedly the same ride', riskDelta: 35,
        result: { tier: 'AMBER', templateId: 'AMBER_CHAIN_REPEATED_DROPS', reason: 'repeated-drops' } },
      { id: 'jammed', label: 'Got jammed between chainring and frame', riskDelta: 45,
        result: { tier: 'AMBER', templateId: 'AMBER_CHAIN_REPEATED_DROPS', reason: 'chain-suck-jam' } },
    ],
  },
  CHAIN_03: {
    id: 'CHAIN_03', category: 'CHAIN', keefPose: 'magnify',
    text: 'Has the chain been split and rejoined recently — say, with a quick-link or chain tool?',
    options: [
      { id: 'yes', label: 'Yes', riskDelta: 35,
        result: { tier: 'AMBER', templateId: 'AMBER_CHAIN_WORN', reason: 'verify-quicklink' } },
      { id: 'no', label: 'No', riskDelta: 0,
        result: { tier: 'GREEN', templateId: 'GREEN_CHAIN_STIFF_LINK_RELUBE', reason: 'stiff-link-dry' } },
    ],
  },
  CHAIN_04: {
    id: 'CHAIN_04', category: 'CHAIN', keefPose: 'magnify',
    text: 'Stand over the bike and try to wiggle the cranks side to side. Any play?',
    options: [
      { id: 'play', label: 'Yes, side-to-side play', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_BB_CRANK_PLAY', reason: 'crank-play' } },
      { id: 'no_play', label: 'No play', riskDelta: 20,
        result: { tier: 'AMBER', templateId: 'AMBER_BB_CREAK', reason: 'creak-source-tbd' } },
      NOT_SURE_TO_AMBER,
    ],
  },

  // ---------- TYRES & WHEELS ----------
  TW_01: {
    id: 'TW_01', category: 'TYRES_WHEELS', keefPose: 'magnify',
    text: 'What is the tyre or wheel doing?',
    options: [
      { id: 'puncture', label: 'Puncture / flat', riskDelta: 10, next: 'TW_02' },
      { id: 'slow_leak', label: 'Slow leak — goes flat overnight', riskDelta: 15, next: 'TW_03' },
      { id: 'wobble', label: 'Wheel wobbles or buckle visible', riskDelta: 40, next: 'TW_04' },
      { id: 'spoke', label: 'Loose or broken spoke', riskDelta: 40, next: 'TW_05' },
      { id: 'wear', label: 'Tyre tread or sidewall looks worn', riskDelta: 30, next: 'TW_08' },
      { id: 'sidewall_cut', label: 'Visible cut, bulge, or casing showing through tread', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_WHEELS_SIDEWALL', reason: 'sidewall-failure' } },
      NOT_SURE_TO_AMBER,
    ],
  },
  TW_02: {
    id: 'TW_02', category: 'TYRES_WHEELS', keefPose: 'magnify',
    text: 'Is the tyre tubeless (sealant inside) or running an inner tube?',
    options: [
      { id: 'tubed', label: 'Inner tube', riskDelta: 0, next: 'TW_06' },
      { id: 'tubeless', label: 'Tubeless', riskDelta: 0, next: 'TW_07' },
      { id: 'not_sure', label: 'Not sure', riskDelta: 20,
        result: { tier: 'AMBER', templateId: 'AMBER_GENERIC', reason: 'unknown-tyre-type' } },
    ],
  },
  TW_03: {
    id: 'TW_03', category: 'TYRES_WHEELS', keefPose: 'magnify',
    text: 'Tubeless or tubed?',
    options: [
      { id: 'tubeless', label: 'Tubeless — flat overnight, no obvious puncture', riskDelta: -5,
        result: { tier: 'GREEN', templateId: 'GREEN_TYRES_TUBELESS_TOPUP', reason: 'sealant-dry' } },
      { id: 'tubed', label: 'Tubed — slow puncture', riskDelta: 5, next: 'TW_06' },
    ],
  },
  TW_04: {
    id: 'TW_04', category: 'TYRES_WHEELS', keefPose: 'magnify',
    text: 'Lift the wheel, spin it slowly, watch by the brake. Any broken spokes or visible cracks at the spoke nipples?',
    options: [
      { id: 'broken_spoke', label: 'Yes, a spoke is broken or missing', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_WHEELS_BROKEN_SPOKE', reason: 'broken-spoke' } },
      { id: 'crack', label: 'Cracks visible at the rim or spoke nipples', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_WHEELS_CRACKED_RIM', reason: 'cracked-rim' } },
      { id: 'just_wobble', label: 'Just a wobble — no broken spokes or cracks', riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_WHEELS_MILD_BUCKLE', reason: 'mild-buckle' } },
    ],
  },
  TW_05: {
    id: 'TW_05', category: 'TYRES_WHEELS', keefPose: 'magnify',
    text: 'How many spokes are loose or broken?',
    options: [
      { id: 'one_loose', label: 'One spoke loose (you can wiggle it)', riskDelta: 40,
        result: { tier: 'AMBER', templateId: 'AMBER_WHEELS_LOOSE_SPOKE', reason: 'one-loose-spoke' } },
      { id: 'one_broken', label: 'One broken / missing', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_WHEELS_BROKEN_SPOKE', reason: 'one-broken-spoke' } },
      { id: 'multiple', label: 'Multiple loose or broken', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_WHEELS_BROKEN_SPOKE', reason: 'multiple-spokes' } },
    ],
  },
  TW_06: {
    id: 'TW_06', category: 'TYRES_WHEELS', keefPose: 'magnify',
    text: 'Have you had repeated punctures in the same place recently?',
    options: [
      { id: 'yes', label: 'Yes', riskDelta: 25,
        result: { tier: 'AMBER', templateId: 'AMBER_TYRES_REPEATED_PUNCTURES', reason: 'repeated-punctures' } },
      { id: 'no', label: 'No, just this one', riskDelta: -5,
        result: { tier: 'GREEN', templateId: 'GREEN_TYRES_PUNCTURE_TUBED', reason: 'standard-puncture' } },
    ],
  },
  TW_07: {
    id: 'TW_07', category: 'TYRES_WHEELS', keefPose: 'magnify',
    text: 'How does it behave?',
    options: [
      { id: 'topup', label: 'Going down slowly, last sealant top-up was months ago', riskDelta: -5,
        result: { tier: 'GREEN', templateId: 'GREEN_TYRES_TUBELESS_TOPUP', reason: 'sealant-topup' } },
      { id: 'wont_seat', label: "Won't seat with a track pump", riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_TYRES_TUBELESS_BEAD', reason: 'bead-wont-seat' } },
      { id: 'spraying', label: 'Sealant spraying through the sidewall', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_WHEELS_SIDEWALL', reason: 'sidewall-weep' } },
    ],
  },
  TW_08: {
    id: 'TW_08', category: 'TYRES_WHEELS', keefPose: 'magnify',
    text: 'How worn is the tyre?',
    options: [
      { id: 'squared', label: 'Tread squared off / centre worn', riskDelta: 20,
        result: { tier: 'AMBER', templateId: 'AMBER_TYRES_SQUARED_OFF', reason: 'tread-worn' } },
      { id: 'casing', label: 'Casing showing through, bulges, or deep cuts', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_WHEELS_SIDEWALL', reason: 'casing-failure' } },
    ],
  },

  // ---------- HEADSET / STEERING ----------
  HS_01: {
    id: 'HS_01', category: 'HEADSET_STEERING', keefPose: 'magnify',
    text: 'What is the steering doing?',
    options: [
      { id: 'knock', label: 'A knock when I brake hard or hit a bump', riskDelta: 70, next: 'HS_02' },
      { id: 'stiff', label: 'Stiff or notchy when I turn the bars', riskDelta: 35,
        result: { tier: 'AMBER', templateId: 'AMBER_HEADSET_STIFF', reason: 'stiff-headset' } },
      { id: 'loose_bars', label: 'Bars rotate in the stem, or stem turns on its own', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_HEADSET_LOOSE_BARS', reason: 'loose-cockpit' } },
      { id: 'crack', label: 'I can see a crack in the bars, stem, or steerer', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_FRAME_CARBON_CRACK', reason: 'visible-crack' } },
      NOT_SURE_TO_AMBER,
    ],
  },
  HS_02: {
    id: 'HS_02', category: 'HEADSET_STEERING', keefPose: 'magnify',
    text: 'Hold the front brake on hard. Rock the bike forward and back. Do you feel a knock through the head tube (the bit the bars come out of)?',
    helpText: "If you don't feel safe to test this, just say so — better to err on the side of caution.",
    options: [
      { id: 'knock', label: 'Yes, I can feel a knock', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_HEADSET_KNOCK', reason: 'headset-knock' } },
      { id: 'no_knock', label: 'No knock', riskDelta: 20,
        result: { tier: 'AMBER', templateId: 'AMBER_HEADSET_STIFF', reason: 'no-knock-but-symptom' } },
      { id: 'wont_test', label: "Don't want to test it", riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_HEADSET_KNOCK', reason: 'user-wont-test' } },
    ],
  },

  // ---------- CRANKS & BB ----------
  CBB_01: {
    id: 'CBB_01', category: 'CRANKS_BB', keefPose: 'magnify',
    text: 'What is happening around the cranks or bottom bracket area?',
    options: [
      { id: 'creak', label: 'Creak or click when pedalling', riskDelta: 25, next: 'CBB_02' },
      { id: 'play', label: 'I can wobble the crank arms side to side', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_BB_CRANK_PLAY', reason: 'crank-play' } },
      { id: 'grind', label: 'Rough or grinding feel when pedalling', riskDelta: 50,
        result: { tier: 'AMBER', templateId: 'AMBER_BB_GRIND', reason: 'bb-bearings' } },
      NOT_SURE_TO_AMBER,
    ],
  },
  CBB_02: {
    id: 'CBB_02', category: 'CRANKS_BB', keefPose: 'magnify',
    text: 'Does the noise happen only when you are pedalling, or also when you are coasting (not pedalling)?',
    options: [
      { id: 'pedal_only', label: 'Only when pedalling', riskDelta: 25,
        result: { tier: 'AMBER', templateId: 'AMBER_BB_CREAK', reason: 'creak-pedal-only' } },
      { id: 'also_coast', label: 'Also when coasting', riskDelta: 25,
        result: { tier: 'AMBER', templateId: 'AMBER_BB_CREAK', reason: 'creak-also-coast' } },
      NOT_SURE_TO_AMBER,
    ],
  },

  // ---------- SUSPENSION ----------
  SUS_01: {
    id: 'SUS_01', category: 'SUSPENSION', keefPose: 'magnify',
    appliesTo: ['MTB', 'GRAVEL', 'EBIKE', 'HYBRID'],
    text: "What's playing up?",
    options: [
      { id: 'fork', label: 'Front fork', riskDelta: 0, next: 'SUS_02' },
      { id: 'shock', label: 'Rear shock', riskDelta: 0, next: 'SUS_02' },
      { id: 'dropper', label: 'Dropper post', riskDelta: 0, next: 'SUS_04' },
      NOT_SURE_TO_AMBER,
    ],
  },
  SUS_02: {
    id: 'SUS_02', category: 'SUSPENSION', keefPose: 'magnify',
    text: "What's it doing?",
    options: [
      { id: 'sluggish', label: 'Sluggish — feels low or not returning', riskDelta: 25, next: 'SUS_03' },
      { id: 'oil', label: 'Oil weeping onto the stanchions', riskDelta: 35,
        result: { tier: 'AMBER', templateId: 'AMBER_SUSPENSION_LOWER_SERVICE', reason: 'oil-weep' } },
      { id: 'knock', label: 'Knocking on bumps', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_SUSPENSION_FORK', reason: 'fork-knock' } },
      { id: 'stuck', label: "Stuck down or won't compress", riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_SUSPENSION_FORK', reason: 'fork-stuck' } },
      { id: 'topout', label: 'Tops out with a clunk', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_SUSPENSION_FORK', reason: 'fork-topout' } },
    ],
  },
  SUS_03: {
    id: 'SUS_03', category: 'SUSPENSION', keefPose: 'magnify',
    text: 'Have you got a shock pump and know your sag setting?',
    options: [
      { id: 'yes', label: 'Yes', riskDelta: -5,
        result: { tier: 'GREEN', templateId: 'GREEN_SUSPENSION_SAG', reason: 'sag-set' } },
      { id: 'no', label: 'No, no shock pump', riskDelta: 20,
        result: { tier: 'AMBER', templateId: 'AMBER_SUSPENSION_LOWER_SERVICE', reason: 'no-pump-set-in-store' } },
    ],
  },
  SUS_04: {
    id: 'SUS_04', category: 'SUSPENSION', keefPose: 'magnify',
    text: "What's the dropper doing?",
    options: [
      { id: 'wont_extend', label: "Stuck down, won't extend", riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_SUSPENSION_DROPPER', reason: 'dropper-stuck-down' } },
      { id: 'slow', label: 'Drops slowly when seated', riskDelta: 25,
        result: { tier: 'AMBER', templateId: 'AMBER_SUSPENSION_DROPPER', reason: 'dropper-cable-tension' } },
      { id: 'sinking', label: 'Drops by itself under the rider', riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_SUSPENSION_DROPPER', reason: 'dropper-sinking' } },
    ],
  },

  // ---------- E-BIKE ELECTRICS ----------
  EBE_01: {
    id: 'EBE_01', category: 'EBIKE_ELECTRICS', keefPose: 'magnify',
    appliesTo: ['EBIKE'],
    text: 'Battery, motor, display, or wiring?',
    options: [
      { id: 'battery', label: 'Battery', riskDelta: 20, next: 'EBE_02' },
      { id: 'motor', label: 'Motor / assist', riskDelta: 20, next: 'EBE_06' },
      { id: 'display', label: 'Display / control unit', riskDelta: 20, next: 'EBE_07' },
      { id: 'wiring', label: 'Wiring or cables', riskDelta: 30, next: 'EBE_08' },
      NOT_SURE_TO_AMBER,
    ],
  },
  EBE_02: {
    id: 'EBE_02', category: 'EBIKE_ELECTRICS', keefPose: 'magnify',
    text: 'Important first — is the battery swelling, hot to touch, smoking, smelling odd, or discoloured?',
    helpText: "If yes, stop charging it now. Move it away from anything that can catch fire. Don't take it indoors. Phone the shop.",
    options: [
      { id: 'yes', label: 'Yes — any of those', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_EBIKE_BATTERY_THERMAL', reason: 'battery-thermal' } },
      { id: 'no', label: 'No, none of those', riskDelta: 0, next: 'EBE_03' },
    ],
  },
  EBE_03: {
    id: 'EBE_03', category: 'EBIKE_ELECTRICS', keefPose: 'magnify',
    text: 'What is the battery doing?',
    options: [
      { id: 'wont_charge', label: "Won't charge", riskDelta: 30, next: 'EBE_04' },
      { id: 'range', label: 'Range has dropped', riskDelta: 25, next: 'EBE_05' },
      { id: 'water', label: 'Has been pressure-washed or got wet', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_EBIKE_WATER_INGRESS', reason: 'water-ingress' } },
    ],
  },
  EBE_04: {
    id: 'EBE_04', category: 'EBIKE_ELECTRICS', keefPose: 'magnify',
    text: 'Plug the charger into the wall on its own (no battery attached). Any LED on the charger?',
    options: [
      { id: 'no_led', label: 'No LED at all', riskDelta: 35,
        result: { tier: 'AMBER', templateId: 'AMBER_EBIKE_CHARGER_FAILURE', reason: 'charger-no-led' } },
      { id: 'led_yes_battery_no', label: 'Charger LED yes, but battery does not respond when connected', riskDelta: 40,
        result: { tier: 'AMBER', templateId: 'AMBER_GENERIC', reason: 'battery-side-fault' } },
      { id: 'cold', label: 'Battery has been below freezing recently', riskDelta: 0,
        result: { tier: 'GREEN', templateId: 'GREEN_EBIKE_COLD_RANGE', reason: 'cold-charge-refusal' } },
      { id: 'long_storage', label: 'Battery has been stored over winter without charging', riskDelta: 50,
        result: { tier: 'AMBER', templateId: 'AMBER_EBIKE_RANGE_LOSS_AGE', reason: 'deep-discharge-storage' } },
    ],
  },
  EBE_05: {
    id: 'EBE_05', category: 'EBIKE_ELECTRICS', keefPose: 'magnify',
    text: 'How old is the battery, roughly?',
    options: [
      { id: 'cold_recent', label: "Under 2 years and it's cold weather", riskDelta: -5,
        result: { tier: 'GREEN', templateId: 'GREEN_EBIKE_COLD_RANGE', reason: 'cold-range' } },
      { id: 'old', label: 'Over 3 years or 500+ full charges', riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_EBIKE_RANGE_LOSS_AGE', reason: 'aged-battery' } },
      { id: 'sudden', label: "Lost a lot of range in a week — it's not gradual", riskDelta: 50,
        result: { tier: 'AMBER', templateId: 'AMBER_EBIKE_RANGE_LOSS_AGE', reason: 'sudden-capacity-drop' } },
    ],
  },
  EBE_06: {
    id: 'EBE_06', category: 'EBIKE_ELECTRICS', keefPose: 'magnify',
    text: 'What does the motor do?',
    options: [
      { id: 'cuts_at_limit', label: 'Cuts assist at about 15.5 mph / 25 km/h', riskDelta: -5,
        result: { tier: 'GREEN', templateId: 'GREEN_EBIKE_LEGAL_LIMIT_NORMAL', reason: 'legal-limit' } },
      { id: 'climbing_cutout', label: 'Cuts out only on climbs', riskDelta: 35,
        result: { tier: 'AMBER', templateId: 'AMBER_EBIKE_INTERMITTENT', reason: 'thermal-or-sag' } },
      { id: 'random_cutout', label: 'Cuts out randomly', riskDelta: 40,
        result: { tier: 'AMBER', templateId: 'AMBER_EBIKE_INTERMITTENT', reason: 'random-cutout' } },
      { id: 'burning', label: 'Burning smell or grinding from the motor', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_EBIKE_MOTOR_BURN', reason: 'motor-burn' } },
      { id: 'error_code', label: 'Throwing an error code on the display', riskDelta: 50, next: 'EBE_07' },
    ],
  },
  EBE_07: {
    id: 'EBE_07', category: 'EBIKE_ELECTRICS', keefPose: 'magnify',
    text: 'Is the display showing an error code?',
    helpText: "If yes, we'll capture the system and the code so the workshop has it ready.",
    options: [
      { id: 'yes_code', label: 'Yes — there is a code', riskDelta: 40,
        capture: [
          { key: 'ebike_system', prompt: 'Which e-bike system?', type: 'select',
            choices: ['Bosch', 'Shimano STEPS', 'Yamaha', 'Bafang', 'Other', "Don't know"], required: true },
          { key: 'ebike_error_code', prompt: 'What does the display show?', type: 'text', required: true },
        ],
        result: { tier: 'AMBER', templateId: 'AMBER_EBIKE_ERROR_CODE', reason: 'error-code-captured' } },
      { id: 'no_code_random', label: 'No code, but it is behaving randomly', riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_EBIKE_INTERMITTENT', reason: 'display-random' } },
      { id: 'dead', label: 'Display is dead', riskDelta: 35,
        result: { tier: 'AMBER', templateId: 'AMBER_EBIKE_INTERMITTENT', reason: 'display-dead' } },
    ],
  },
  EBE_08: {
    id: 'EBE_08', category: 'EBIKE_ELECTRICS', keefPose: 'magnify',
    text: 'Look at the cabling along the frame, into the motor, into the battery, into the display. Any visible damage?',
    options: [
      { id: 'yes_damage', label: 'Yes — pinched, chafed, or exposed conductors', riskDelta: 100, redFlag: true,
        result: { tier: 'RED', templateId: 'RED_EBIKE_EXPOSED_WIRING', reason: 'wiring-damage' } },
      { id: 'no_intermittent', label: 'No visible damage, just intermittent dropouts', riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_EBIKE_INTERMITTENT', reason: 'intermittent-no-visible' } },
    ],
  },

  // ---------- KIDS sizing ----------
  KIDS_SIZING_01: {
    id: 'KIDS_SIZING_01', category: 'OTHER', keefPose: 'thinking',
    text: 'Is the rider hitting their knees on the bars, or are their heels catching the back wheel?',
    options: [
      { id: 'yes', label: 'Yes', riskDelta: 0,
        result: { tier: 'AMBER', templateId: 'AMBER_KIDS_SIZING', reason: 'kids-outgrown' } },
      { id: 'no', label: 'No, just feels off', riskDelta: 20,
        result: { tier: 'AMBER', templateId: 'AMBER_NOT_SURE', reason: 'kids-vague' } },
    ],
  },

  // ---------- OTHER ----------
  OTHER_01: {
    id: 'OTHER_01', category: 'OTHER', keefPose: 'thinking',
    text: "If something just feels wrong — that's enough reason to get it checked. Want me to recommend a workshop visit?",
    options: [
      { id: 'yes', label: 'Aye, book me in', riskDelta: 30,
        result: { tier: 'AMBER', templateId: 'AMBER_NOT_SURE', reason: 'general-uncertainty' } },
      { id: 'no', label: 'Not yet — let me think', riskDelta: 0,
        result: { tier: 'AMBER', templateId: 'AMBER_NOT_SURE', reason: 'user-deferring' } },
    ],
  },
};
