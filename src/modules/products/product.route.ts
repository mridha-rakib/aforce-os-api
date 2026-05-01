import { authenticate, requireRole } from '../../common/middleware/auth.middleware';
import { BaseRoute } from '../../common/http/base-route';
import { RequestValidator } from '../../common/http/validate-request';
import { productController, type ProductController } from './product.controller';
import {
  createProductRequestSchema,
  listProductsRequestSchema,
  productParamsRequestSchema,
  updateProductRequestSchema,
} from './product.schema';

export class ProductRoute extends BaseRoute {
  public constructor(private readonly controller: ProductController) {
    super('/products', 'admin');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.get(
      '/',
      { audience: 'user', name: 'List Products' },
      authenticate,
      RequestValidator.validate(listProductsRequestSchema),
      this.controller.listProducts,
    );
    this.post(
      '/',
      { audience: 'admin', name: 'Create Product' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(createProductRequestSchema),
      this.controller.createProduct,
    );
    this.get(
      '/:productId',
      { audience: 'user', name: 'Get Product' },
      authenticate,
      RequestValidator.validate(productParamsRequestSchema),
      this.controller.getProduct,
    );
    this.patch(
      '/:productId',
      { audience: 'admin', name: 'Update Product' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(updateProductRequestSchema),
      this.controller.updateProduct,
    );
    this.delete(
      '/:productId',
      { audience: 'admin', name: 'Delete Product' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(productParamsRequestSchema),
      this.controller.deleteProduct,
    );
  }
}

export const productRoute = new ProductRoute(productController);
