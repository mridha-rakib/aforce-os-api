import type { HydratedDocument } from 'mongoose';

import { ProductModel } from './product.model';
import type { Product } from './product.model';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './product.schema';

export type ProductStatus = 'Active' | 'Inactive';

export interface CreateProductRecordInput extends CreateProductInput {
  readonly sku: string;
}

export interface ProductRecord {
  readonly benefits: string[];
  readonly category: string;
  readonly createdAt: Date;
  readonly description: string;
  readonly id: string;
  readonly image?: string;
  readonly name: string;
  readonly price: number;
  readonly sku: string;
  readonly status: ProductStatus;
  readonly stock: number;
  readonly updatedAt: Date;
}

interface ProductSnapshot {
  benefits: string[];
  category: string;
  createdAt: Date;
  description?: string;
  image?: string | null;
  name: string;
  price: number;
  sku: string;
  status: ProductStatus;
  stock: number;
  updatedAt: Date;
}

interface ProductFindFilters {
  $or?: Array<{ category: RegExp } | { name: RegExp } | { sku: RegExp }>;
  category?: string;
  status?: ProductStatus;
}

export class ProductRepository {
  public async count(): Promise<number> {
    return ProductModel.countDocuments().exec();
  }

  public async create(input: CreateProductRecordInput): Promise<ProductRecord> {
    const created = new ProductModel({
      benefits: input.benefits,
      category: input.category,
      description: input.description ?? '',
      name: input.name,
      price: input.price,
      sku: input.sku,
      status: input.status,
      stock: input.stock,
    });

    if (input.image) {
      created.image = input.image;
    }

    await created.save();

    return this.toRecord(created);
  }

  public async deleteById(productId: string): Promise<ProductRecord | null> {
    const product = await ProductModel.findByIdAndDelete(productId).exec();

    return product ? this.toRecord(product) : null;
  }

  public async findById(productId: string): Promise<ProductRecord | null> {
    const product = await ProductModel.findById(productId).exec();

    return product ? this.toRecord(product) : null;
  }

  public async findBySku(sku: string): Promise<ProductRecord | null> {
    const product = await ProductModel.findOne({ sku: sku.toUpperCase() }).exec();

    return product ? this.toRecord(product) : null;
  }

  public async findMany(query: ListProductsQuery): Promise<ProductRecord[]> {
    const filters: ProductFindFilters = {};

    if (query.category) {
      filters.category = query.category;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.search) {
      const expression = new RegExp(escapeRegExp(query.search), 'i');
      filters.$or = [{ name: expression }, { sku: expression }, { category: expression }];
    }

    const products = await ProductModel.find(filters).sort({ createdAt: -1 }).exec();

    return products.map((product) => this.toRecord(product));
  }

  public async updateById(productId: string, input: UpdateProductInput): Promise<ProductRecord | null> {
    const set: Partial<{
      benefits: string[];
      category: string;
      description: string;
      image: string;
      name: string;
      price: number;
      status: ProductStatus;
      stock: number;
    }> = {};
    const unset: Record<string, 1> = {};

    if (input.benefits) {
      set.benefits = input.benefits;
    }

    if (input.category) {
      set.category = input.category;
    }

    if (input.description !== undefined) {
      set.description = input.description ?? '';
    }

    if (input.image !== undefined) {
      if (input.image) {
        set.image = input.image;
      } else {
        unset.image = 1;
      }
    }

    if (input.name) {
      set.name = input.name;
    }

    if (input.price !== undefined) {
      set.price = input.price;
    }

    if (input.status) {
      set.status = input.status;
    }

    if (input.stock !== undefined) {
      set.stock = input.stock;
    }

    const product = await ProductModel.findByIdAndUpdate(
      productId,
      {
        ...(Object.keys(set).length > 0 ? { $set: set } : {}),
        ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
      },
      { new: true, runValidators: true },
    ).exec();

    return product ? this.toRecord(product) : null;
  }

  private toRecord(document: HydratedDocument<Product>): ProductRecord {
    const snapshot = document.toObject() as ProductSnapshot;
    const record: ProductRecord = {
      benefits: snapshot.benefits ?? [],
      category: snapshot.category,
      createdAt: snapshot.createdAt,
      description: snapshot.description ?? '',
      id: document.id,
      name: snapshot.name,
      price: snapshot.price,
      sku: snapshot.sku,
      status: snapshot.status,
      stock: snapshot.stock,
      updatedAt: snapshot.updatedAt,
    };

    return {
      ...record,
      ...(snapshot.image ? { image: snapshot.image } : {}),
    };
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const productRepository = new ProductRepository();
