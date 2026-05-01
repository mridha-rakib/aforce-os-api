import OpenAI from 'openai';
import { z } from 'zod';

import { logger } from '../../common/logger';
import { env } from '../../config/env';
import type { HydrationDecision } from '../../modules/ai/ai.service';
import type { HydrationDecisionInput } from '../../modules/ai/ai.schema';

export const hydrationAiCoachingSchema = z.object({
  disclaimer: z.string().trim().min(1).max(180),
  headline: z.string().trim().min(1).max(90),
  nextActionText: z.string().trim().min(1).max(180),
  notificationBody: z.string().trim().min(1).max(150),
  notificationTitle: z.string().trim().min(1).max(60),
  source: z.literal('openai'),
  summary: z.string().trim().min(1).max(260),
  why: z.array(z.string().trim().min(1).max(120)).min(1).max(3),
});

export type HydrationAiCoaching = z.infer<typeof hydrationAiCoachingSchema>;

const hydrationAiCoachingJsonSchema = {
  additionalProperties: false,
  properties: {
    disclaimer: {
      type: 'string',
    },
    headline: {
      type: 'string',
    },
    nextActionText: {
      type: 'string',
    },
    notificationBody: {
      type: 'string',
    },
    notificationTitle: {
      type: 'string',
    },
    source: {
      const: 'openai',
      type: 'string',
    },
    summary: {
      type: 'string',
    },
    why: {
      items: {
        type: 'string',
      },
      type: 'array',
    },
  },
  required: [
    'disclaimer',
    'headline',
    'nextActionText',
    'notificationBody',
    'notificationTitle',
    'source',
    'summary',
    'why',
  ],
  type: 'object',
};

const systemInstructions = [
  'You are the AForce hydration coaching assistant.',
  'Use the deterministic hydration decision exactly as provided. Do not change scores, targets, risk levels, or amounts.',
  'Give concise wellness guidance only. Do not diagnose, treat, or claim medical certainty.',
  'If risk is high or critical, recommend prompt hydration and professional medical help for severe symptoms.',
  'Use the same measurement unit style as the input, prioritizing ml.',
  'Return only JSON matching the requested schema.',
].join('\n');

export class OpenAiHydrationCoachService {
  private client: OpenAI | null = null;

  public isConfigured(): boolean {
    return env.OPENAI_API_KEY.trim().length > 0;
  }

  public async generateCoaching(
    input: HydrationDecisionInput,
    decision: HydrationDecision,
  ): Promise<HydrationAiCoaching | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await this.getClient().responses.create({
        input: JSON.stringify({
          context: input.context,
          decision: {
            consumedMl: decision.consumedMl,
            drivers: decision.drivers,
            electrolyteRecommendedMl: decision.electrolyteRecommendedMl,
            hydrationRiskScore: decision.hydrationRiskScore,
            hydrationTargetMl: decision.hydrationTargetMl,
            nextAction: decision.nextAction,
            recommendations: decision.recommendations,
            remainingMl: decision.remainingMl,
            riskLevel: decision.riskLevel,
            urgency: decision.urgency,
          },
          intakeToday: input.intakeToday,
          profile: input.profile,
          signals: input.signals,
        }),
        instructions: systemInstructions,
        max_output_tokens: env.OPENAI_MAX_OUTPUT_TOKENS,
        model: env.OPENAI_MODEL,
        safety_identifier: input.userId,
        store: false,
        text: {
          format: {
            description: 'Short structured wellness coaching copy for a hydration decision.',
            name: 'hydration_coaching',
            schema: hydrationAiCoachingJsonSchema,
            strict: true,
            type: 'json_schema',
          },
        },
      });

      return hydrationAiCoachingSchema.parse(JSON.parse(response.output_text));
    } catch (error) {
      logger.warn('OpenAI hydration coaching generation failed; using rules fallback.', {
        error,
        model: env.OPENAI_MODEL,
      });
      return null;
    }
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
        timeout: env.OPENAI_TIMEOUT_MS,
      });
    }

    return this.client;
  }
}

export const openAiHydrationCoachService = new OpenAiHydrationCoachService();
