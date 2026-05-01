import { BaseController } from '../../common/http/base-controller';
import type { CreateProductInput, ProductParams, UpdateProductInput } from './product.schema';
import { productService, type ProductService } from './product.service';

export class ProductController extends BaseController {
  public constructor(private readonly service: ProductService) {
    super();
  }

  public readonly createProduct = this.handleRequest(async (request, response) => {
    const product = await this.service.createProduct(request.body as CreateProductInput);
    this.created(response, 'Product created successfully.', product);
  });

  public readonly deleteProduct = this.handleRequest(async (request, response) => {
    const result = await this.service.deleteProduct((request.params as ProductParams).productId);
    this.ok(response, 'Product deleted successfully.', result);
  });

  public readonly getProduct = this.handleRequest(async (request, response) => {
    const product = await this.service.getProduct((request.params as ProductParams).productId);
    this.ok(response, 'Product fetched successfully.', product);
  });

  public readonly listProducts = this.handleRequest(async (request, response) => {
    const products = await this.service.listProducts(request.query);
    this.ok(response, 'Products fetched successfully.', products);
  });

  public readonly updateProduct = this.handleRequest(async (request, response) => {
    const product = await this.service.updateProduct(
      (request.params as ProductParams).productId,
      request.body as UpdateProductInput,
    );
    this.ok(response, 'Product updated successfully.', product);
  });
}

export const productController = new ProductController(productService);
