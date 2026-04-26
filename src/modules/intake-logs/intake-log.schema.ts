import { z } from 'zod';

export const createIntakeLogBodySchema = z.object({
  amountMl: z.number().positive(),
  barcodeValue: z.string().min(1).optional(),
  consumedAt: z.coerce.date().optional(),
  electrolyteStrength: z.enum(['low', 'medium', 'high']).optional(),
  hydrationScoreDelta: z.number().min(0).default(0),
  nfcTagUid: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  productName: z.string().min(1).optional(),
  productSku: z.string().min(1).optional(),
  source: z.enum(['water', 'electrolyte', 'nfc', 'barcode', 'manual']),
  userId: z.string().min(1),
});

export const listIntakeLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().min(1).optional(),
});

export const createIntakeLogRequestSchema = {
  body: createIntakeLogBodySchema,
};

export const listIntakeLogsRequestSchema = {
  query: listIntakeLogsQuerySchema,
};

export type CreateIntakeLogInput = z.infer<typeof createIntakeLogBodySchema>;
export type ListIntakeLogsQuery = z.infer<typeof listIntakeLogsQuerySchema>;
