import { z } from 'zod';

import {
  hydrationContextSchema,
  hydrationProfileSchema,
  intakeTodaySchema,
} from '../ai/ai.schema';

export const hydrationPlanBodySchema = z.object({
  context: hydrationContextSchema.extend({
    wakeHour: z.number().int().min(0).max(23).default(7),
    workoutStartHour: z.number().int().min(0).max(23).optional(),
  }),
  intakeToday: intakeTodaySchema,
  profile: hydrationProfileSchema,
  userId: z.string().min(1),
});

export const hydrationPlanRequestSchema = {
  body: hydrationPlanBodySchema,
};

export type HydrationPlanInput = z.infer<typeof hydrationPlanBodySchema>;
