import { z } from 'zod';

export const hydrationProfileSchema = z.object({
  activityLevel: z.enum(['low', 'moderate', 'high', 'elite']),
  goal: z.enum(['wellness', 'performance', 'recovery']).default('wellness'),
  weightKg: z.number().positive(),
});

export const hydrationContextSchema = z.object({
  ambientTempC: z.number().min(-20).max(60),
  humidityPct: z.number().min(0).max(100),
  sleepHours: z.number().min(0).max(24).default(7),
  steps: z.number().min(0),
  workoutMinutes: z.number().min(0),
});

export const hydrationSignalsSchema = z.object({
  heartRateBpm: z.number().positive().optional(),
  sweatRateDeltaPct: z.number().min(-100).max(500).optional(),
  thirstLevel: z.number().int().min(1).max(5).optional(),
  urineColorScore: z.number().int().min(1).max(8).optional(),
});

export const intakeTodaySchema = z.object({
  electrolyteMl: z.number().min(0),
  waterMl: z.number().min(0),
});

export const hydrationDecisionBodySchema = z.object({
  context: hydrationContextSchema,
  intakeToday: intakeTodaySchema,
  profile: hydrationProfileSchema,
  signals: hydrationSignalsSchema.default({}),
  userId: z.string().min(1),
});

export const hydrationDecisionRequestSchema = {
  body: hydrationDecisionBodySchema,
};

export type HydrationDecisionInput = z.infer<typeof hydrationDecisionBodySchema>;
