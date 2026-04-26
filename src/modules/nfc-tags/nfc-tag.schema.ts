import { z } from 'zod';

export const nfcTagStatusSchema = z.enum(['active', 'claimed', 'blocked', 'retired']);

export const registerNfcTagBodySchema = z.object({
  batchCode: z.string().min(1),
  electrolyteBoost: z.number().min(0).default(0),
  flavor: z.string().min(1).optional(),
  hydrationBoost: z.number().min(0).default(0),
  productName: z.string().min(1),
  productSku: z.string().min(1),
  status: nfcTagStatusSchema.default('active'),
  tagUid: z.string().min(1),
  volumeMl: z.number().positive(),
});

export const scanNfcTagBodySchema = z.object({
  deviceId: z.string().min(1),
  scannedAt: z.coerce.date().optional(),
  tagUid: z.string().min(1),
  userId: z.string().min(1),
});

export const nfcTagParamsSchema = z.object({
  tagUid: z.string().min(1),
});

export const registerNfcTagRequestSchema = {
  body: registerNfcTagBodySchema,
};

export const scanNfcTagRequestSchema = {
  body: scanNfcTagBodySchema,
};

export const getNfcTagRequestSchema = {
  params: nfcTagParamsSchema,
};

export type RegisterNfcTagInput = z.infer<typeof registerNfcTagBodySchema>;
export type ScanNfcTagInput = z.infer<typeof scanNfcTagBodySchema>;
