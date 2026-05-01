import { ResourceNotFoundError } from '../../common/errors/http-errors';
import {
  productRepository,
  type ProductRecord,
  type ProductRepository,
} from './product.repository';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './product.schema';

export class ProductService {
  public constructor(private readonly repository: ProductRepository) {}

  public async createProduct(input: CreateProductInput): Promise<ProductRecord> {
    const sku = await this.createNextSku();

    return this.repository.create({
      ...input,
      sku,
    });
  }

  public async deleteProduct(productId: string): Promise<{ productId: string }> {
    const deleted = await this.repository.deleteById(productId);

    if (!deleted) {
      throw new ResourceNotFoundError('Product', { productId });
    }

    return { productId };
  }

  public async getProduct(productId: string): Promise<ProductRecord> {
    const product = await this.repository.findById(productId);

    if (!product) {
      throw new ResourceNotFoundError('Product', { productId });
    }

    return product;
  }

  public async listProducts(query: ListProductsQuery): Promise<ProductRecord[]> {
    return this.repository.findMany(query);
  }

  public async updateProduct(productId: string, input: UpdateProductInput): Promise<ProductRecord> {
    const product = await this.repository.updateById(productId, input);

    if (!product) {
      throw new ResourceNotFoundError('Product', { productId });
    }

    return product;
  }

  private async createNextSku(): Promise<string> {
    const count = await this.repository.count();

    for (let offset = 1; offset <= 1000; offset += 1) {
      const sku = `AF-${String(count + offset).padStart(5, '0')}`;
      const existing = await this.repository.findBySku(sku);

      if (!existing) {
        return sku;
      }
    }

    throw new Error('Unable to allocate a product SKU.');
  }
}

export const productService = new ProductService(productRepository);
