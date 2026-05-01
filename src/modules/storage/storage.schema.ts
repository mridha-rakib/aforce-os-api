import { z } from 'zod';

export const uploadFileBodySchema = z.object({
  folder: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9/_-]+$/)
    .default('content'),
});

export type UploadFileBody = z.infer<typeof uploadFileBodySchema>;
