import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const productSchema = new Schema(
  {
    benefits: {
      default: [],
      type: [String],
    },
    category: {
      required: true,
      trim: true,
      type: String,
    },
    description: {
      default: '',
      maxlength: 500,
      trim: true,
      type: String,
    },
    image: {
      trim: true,
      type: String,
    },
    name: {
      required: true,
      trim: true,
      type: String,
    },
    price: {
      min: 0,
      required: true,
      type: Number,
    },
    sku: {
      index: true,
      required: true,
      trim: true,
      type: String,
      unique: true,
      uppercase: true,
    },
    status: {
      default: 'Active',
      enum: ['Active', 'Inactive'],
      required: true,
      type: String,
    },
    stock: {
      min: 0,
      required: true,
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: 'text', sku: 'text', category: 'text' });

export type Product = InferSchemaType<typeof productSchema>;

export const ProductModel = model<Product>('Product', productSchema);
