import { z } from 'zod';

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );

export const coachingFeedQuerySchema = z.object({
  category: optionalTrimmedString(80),
});

export const coachingContentParamsSchema = z.object({
  contentId: z.string().min(1),
});

export const coachingFeedRequestSchema = {
  query: coachingFeedQuerySchema,
};

export const coachingContentParamsRequestSchema = {
  params: coachingContentParamsSchema,
};

export type CoachingContentParams = z.infer<typeof coachingContentParamsSchema>;
export type CoachingFeedQuery = z.infer<typeof coachingFeedQuerySchema>;
