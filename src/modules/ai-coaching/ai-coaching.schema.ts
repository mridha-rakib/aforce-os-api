import { z } from 'zod';

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );

export const aiCoachingContentStatusSchema = z.enum(['Published', 'Draft', 'Archived']);
export const aiCoachingContentTypeSchema = z.enum(['Video', 'Article', 'Tip']);
export const aiCoachingVideoTypeSchema = z.enum(['video/mp4', 'video/webm', 'video/quicktime']);

export const aiCoachingRoutineStepSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(160),
});

export const createAiCoachingContentBodySchema = z.object({
  category: z.string().trim().min(1).max(80),
  coachName: optionalTrimmedString(80),
  coachTitle: optionalTrimmedString(120),
  description: optionalTrimmedString(300),
  duration: optionalTrimmedString(20),
  featured: z.boolean().default(false),
  impactLabel: optionalTrimmedString(80),
  impactScore: z.coerce.number().int().min(-100).max(100).optional(),
  publishToApp: z.boolean().default(true),
  recommendedProductId: optionalTrimmedString(80),
  routineSteps: z.array(aiCoachingRoutineStepSchema).max(6).optional(),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(100),
  status: aiCoachingContentStatusSchema.default('Published'),
  technicalPoints: z.array(z.string().trim().min(1).max(160)).max(8).optional(),
  thumbnailKey: optionalTrimmedString(500),
  thumbnailUrl: optionalTrimmedString(2_000),
  title: z.string().trim().min(1).max(160),
  type: aiCoachingContentTypeSchema.default('Video'),
  videoKey: z.string().trim().min(1).max(500),
  videoName: z.string().trim().min(1).max(255),
  videoSizeBytes: z.coerce.number().int().min(1).max(50 * 1024 * 1024),
  videoType: aiCoachingVideoTypeSchema,
  videoUrl: z.string().trim().url().max(2_000),
});

export const updateAiCoachingContentBodySchema = createAiCoachingContentBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one AI coaching content field is required.',
);

export const listAiCoachingContentQuerySchema = z.object({
  category: optionalTrimmedString(80),
  search: optionalTrimmedString(120),
  status: aiCoachingContentStatusSchema.optional(),
  type: aiCoachingContentTypeSchema.optional(),
});

export const aiCoachingContentParamsSchema = z.object({
  contentId: z.string().min(1),
});

export const createAiCoachingContentRequestSchema = {
  body: createAiCoachingContentBodySchema,
};

export const updateAiCoachingContentRequestSchema = {
  body: updateAiCoachingContentBodySchema,
  params: aiCoachingContentParamsSchema,
};

export const listAiCoachingContentRequestSchema = {
  query: listAiCoachingContentQuerySchema,
};

export const aiCoachingContentParamsRequestSchema = {
  params: aiCoachingContentParamsSchema,
};

export type AiCoachingContentParams = z.infer<typeof aiCoachingContentParamsSchema>;
export type CreateAiCoachingContentInput = z.infer<typeof createAiCoachingContentBodySchema>;
export type ListAiCoachingContentQuery = z.infer<typeof listAiCoachingContentQuerySchema>;
export type UpdateAiCoachingContentInput = z.infer<typeof updateAiCoachingContentBodySchema>;
