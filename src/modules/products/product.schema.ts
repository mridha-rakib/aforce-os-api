import { z } from 'zod';

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );

export const productStatusSchema = z.enum(['Active', 'Inactive']);

export const createProductBodySchema = z.object({
  benefits: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  category: z.string().trim().min(1).max(80),
  description: optionalTrimmedString(500),
  image: optionalTrimmedString(7_000_000),
  name: z.string().trim().min(1).max(120),
  price: z.coerce.number().min(0),
  status: productStatusSchema.default('Active'),
  stock: z.coerce.number().int().min(0),
});

export const updateProductBodySchema = createProductBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one product field is required.',
);

export const listProductsQuerySchema = z.object({
  category: optionalTrimmedString(80),
  search: optionalTrimmedString(120),
  status: productStatusSchema.optional(),
});

export const productParamsSchema = z.object({
  productId: z.string().min(1),
});

export const createProductRequestSchema = {
  body: createProductBodySchema,
};

export const updateProductRequestSchema = {
  body: updateProductBodySchema,
  params: productParamsSchema,
};

export const listProductsRequestSchema = {
  query: listProductsQuerySchema,
};

export const productParamsRequestSchema = {
  params: productParamsSchema,
};

export type CreateProductInput = z.infer<typeof createProductBodySchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type ProductParams = z.infer<typeof productParamsSchema>;
export type UpdateProductInput = z.infer<typeof updateProductBodySchema>;
