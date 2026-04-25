// Country Cycles Killearn — KEEF Diagnostic Engine (web port)
// Stateful walker over the question tree. Framework-agnostic.

import { CAVEATS, CTAS, RESULT_TEMPLATES } from './content.js';
import {
  BIKE_TYPE_MODIFIERS,
  HARD_RED_FLAGS,
  SAFETY_CRITICAL_CATEGORIES,
  maxTier,
  tierFromScore,
} from './escalation.js';
import { ENTRY_QUESTION_ID, QUESTIONS } from './tree.js';

export class DiagnosticEngine {
  constructor() {
    this.state = {
      bikeType: undefined,
      riskScore: 0,
      redFlagFired: false,
      history: [],
      captured: {},
      currentQuestionId: ENTRY_QUESTION_ID,
      result: undefined,
    };
  }

  currentQuestion() {
    if (this.state.result) return null;
    if (!this.state.currentQuestionId) return null;
    const q = QUESTIONS[this.state.currentQuestionId];
    if (!q) throw new Error(`Unknown question id: ${this.state.currentQuestionId}`);
    return q;
  }

  snapshot() { return JSON.parse(JSON.stringify(this.state)); }

  answer(optionId, captureValues = {}) {
    const q = this.currentQuestion();
    if (!q) throw new Error('Cannot answer: diagnostic already terminated.');
    const opt = q.options.find((o) => o.id === optionId);
    if (!opt) throw new Error(`Option '${optionId}' not valid for question '${q.id}'.`);

    if (opt.capture) {
      for (const field of opt.capture) {
        const val = captureValues[field.key];
        if (field.required && (val === undefined || String(val).trim() === '')) {
          throw new Error(`Capture value for '${field.key}' is required.`);
        }
        if (val !== undefined) this.state.captured[field.key] = String(val);
      }
    }

    if (q.id === ENTRY_QUESTION_ID) {
      this.state.bikeType = opt.id;
      this.state.captured['bike_type'] = opt.id;
    }

    this.state.history.push({
      questionId: q.id,
      questionText: q.text,
      optionId: opt.id,
      optionLabel: opt.label,
      riskDelta: opt.riskDelta ?? 0,
      redFlag: !!opt.redFlag,
    });

    const delta = opt.riskDelta ?? 0;
    const multiplier =
      delta > 0 && this.state.bikeType
        ? (BIKE_TYPE_MODIFIERS[this.state.bikeType]?.riskMultiplier ?? 1)
        : 1;
    this.state.riskScore = Math.max(0, this.state.riskScore + delta * multiplier);

    if (opt.redFlag) this.state.redFlagFired = true;

    if (opt.result) { this.terminate(opt.result, q.category); return null; }
    if (opt.next) { this.state.currentQuestionId = opt.next; return this.currentQuestion(); }

    this.terminate(
      { tier: 'AMBER', templateId: 'AMBER_NOT_SURE', reason: 'tree-dead-end' },
      q.category,
    );
    return null;
  }

  exitNotSure() {
    const q = this.currentQuestion();
    if (q) {
      this.state.history.push({
        questionId: q.id, questionText: q.text,
        optionId: '__exit_not_sure__',
        optionLabel: "I'm not sure / not comfortable answering",
        riskDelta: 25, redFlag: false,
      });
      this.state.riskScore += 25;
      this.terminate(
        { tier: 'AMBER', templateId: 'AMBER_NOT_SURE', reason: 'user-exit-not-sure' },
        q.category,
      );
    }
    return null;
  }

  result() { return this.state.result ?? null; }

  terminate(trigger, category) {
    const finalTier = this.resolveFinalTier(trigger, category);
    let templateId = trigger.templateId;
    if (finalTier !== trigger.tier) templateId = this.escalateTemplate(templateId, finalTier);

    const template = RESULT_TEMPLATES[templateId];
    if (!template) throw new Error(`Missing result template: ${templateId}`);
    const cta = CTAS[template.ctaId];

    this.state.result = {
      tier: finalTier,
      templateId: template.id,
      keefPose: template.keefPose,
      headline: template.headline,
      body: template.body,
      actionLine: template.actionLine,
      ctaId: template.ctaId,
      ctaLabel: cta.label,
      ctaUrgent: cta.urgent,
      ctaExtra: cta.extra,
      shortCaveat: CAVEATS.short,
      bookingNote: {
        bikeType: this.state.bikeType,
        category,
        tier: finalTier,
        trigger: trigger.reason ?? template.id,
        history: this.state.history,
        captured: this.state.captured,
        riskScore: this.state.riskScore,
      },
    };
  }

  resolveFinalTier(trigger, category) {
    let tier = trigger.tier;
    if (this.state.redFlagFired) tier = 'RED';
    if (this.state.bikeType) {
      const min = BIKE_TYPE_MODIFIERS[this.state.bikeType]?.forceMinTierOn?.[category];
      if (min) tier = maxTier(tier, min);
    }
    if (
      trigger.tier === 'GREEN' &&
      SAFETY_CRITICAL_CATEGORIES.includes(category) &&
      this.state.riskScore > 25
    ) {
      tier = maxTier(tier, 'AMBER');
    }
    tier = maxTier(tier, tierFromScore(this.state.riskScore));
    return tier;
  }

  escalateTemplate(originalId, newTier) {
    const original = RESULT_TEMPLATES[originalId];
    if (original && original.tier === newTier) return originalId;
    if (newTier === 'RED') return 'RED_GENERIC_DO_NOT_RIDE';
    if (newTier === 'AMBER') return 'AMBER_GENERIC';
    return originalId;
  }

  static hardRedFlagPrompts() {
    return HARD_RED_FLAGS.map((f) => ({ id: f.id, prompt: f.prompt }));
  }

  triggerHardRedFlag(flagId) {
    const flag = HARD_RED_FLAGS.find((f) => f.id === flagId);
    if (!flag) throw new Error(`Unknown hard red flag: ${flagId}`);
    this.state.redFlagFired = true;
    this.state.history.push({
      questionId: 'HARD_RED_FLAG', questionText: flag.prompt,
      optionId: flag.id, optionLabel: 'Yes', riskDelta: 100, redFlag: true,
    });
    this.state.riskScore += 100;
    this.terminate(
      { tier: 'RED', templateId: flag.templateId, reason: `hard-red-flag:${flag.id}` },
      'BRAKES',
    );
    return null;
  }
}

export function longCaveat()  { return CAVEATS.long;  }
export function shortCaveat() { return CAVEATS.short; }
export function resultTemplate(id) { return RESULT_TEMPLATES[id]; }
