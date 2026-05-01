import { authenticate, requireRole } from '../../common/middleware/auth.middleware';
import { BaseRoute } from '../../common/http/base-route';
import { RequestValidator } from '../../common/http/validate-request';
import { contentController, type ContentController } from './content.controller';
import {
  contentParamsRequestSchema,
  createContentRequestSchema,
  listContentRequestSchema,
  updateContentRequestSchema,
} from './content.schema';

export class ContentRoute extends BaseRoute {
  public constructor(private readonly controller: ContentController) {
    super('/content', 'admin');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.get(
      '/',
      { name: 'List Content' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(listContentRequestSchema),
      this.controller.listContent,
    );
    this.post(
      '/',
      { name: 'Create Content' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(createContentRequestSchema),
      this.controller.createContent,
    );
    this.get(
      '/:contentId',
      { name: 'Get Content' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(contentParamsRequestSchema),
      this.controller.getContent,
    );
    this.patch(
      '/:contentId',
      { name: 'Update Content' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(updateContentRequestSchema),
      this.controller.updateContent,
    );
    this.delete(
      '/:contentId',
      { name: 'Delete Content' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(contentParamsRequestSchema),
      this.controller.deleteContent,
    );
  }
}

export const contentRoute = new ContentRoute(contentController);
