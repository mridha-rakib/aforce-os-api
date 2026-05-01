import { z } from 'zod';

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );

export const contentStatusSchema = z.enum(['Published', 'Draft', 'Archived']);
export const contentTypeSchema = z.enum(['Video', 'Article', 'Tip']);

export const createContentBodySchema = z.object({
  category: z.string().trim().min(1).max(80),
  mediaKey: optionalTrimmedString(500),
  mediaName: optionalTrimmedString(255),
  mediaType: optionalTrimmedString(120),
  mediaUrl: optionalTrimmedString(2_000),
  status: contentStatusSchema.default('Draft'),
  subtitle: optionalTrimmedString(500),
  thumbnail: optionalTrimmedString(7_000_000),
  thumbnailKey: optionalTrimmedString(500),
  title: z.string().trim().min(1).max(160),
  type: contentTypeSchema.default('Video'),
});

export const updateContentBodySchema = createContentBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one content field is required.',
);

export const listContentQuerySchema = z.object({
  category: optionalTrimmedString(80),
  search: optionalTrimmedString(120),
  status: contentStatusSchema.optional(),
  type: contentTypeSchema.optional(),
});

export const contentParamsSchema = z.object({
  contentId: z.string().min(1),
});

export const createContentRequestSchema = {
  body: createContentBodySchema,
};

export const updateContentRequestSchema = {
  body: updateContentBodySchema,
  params: contentParamsSchema,
};

export const listContentRequestSchema = {
  query: listContentQuerySchema,
};

export const contentParamsRequestSchema = {
  params: contentParamsSchema,
};

export type ContentParams = z.infer<typeof contentParamsSchema>;
export type CreateContentInput = z.infer<typeof createContentBodySchema>;
export type ListContentQuery = z.infer<typeof listContentQuerySchema>;
export type UpdateContentInput = z.infer<typeof updateContentBodySchema>;
