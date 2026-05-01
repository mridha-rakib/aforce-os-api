import { authenticate, requireRole } from '../../common/middleware/auth.middleware';
import { BaseRoute } from '../../common/http/base-route';
import { RequestValidator } from '../../common/http/validate-request';
import {
  aiCoachingContentController,
  type AiCoachingContentController,
} from './ai-coaching.controller';
import {
  aiCoachingContentParamsRequestSchema,
  createAiCoachingContentRequestSchema,
  listAiCoachingContentRequestSchema,
  updateAiCoachingContentRequestSchema,
} from './ai-coaching.schema';

export class AiCoachingContentRoute extends BaseRoute {
  public constructor(private readonly controller: AiCoachingContentController) {
    super('/ai-coaching', 'admin');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.get(
      '/',
      { name: 'List AI Coaching Content' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(listAiCoachingContentRequestSchema),
      this.controller.listContent,
    );
    this.post(
      '/',
      { name: 'Create AI Coaching Content' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(createAiCoachingContentRequestSchema),
      this.controller.createContent,
    );
    this.get(
      '/:contentId',
      { name: 'Get AI Coaching Content' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(aiCoachingContentParamsRequestSchema),
      this.controller.getContent,
    );
    this.patch(
      '/:contentId',
      { name: 'Update AI Coaching Content' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(updateAiCoachingContentRequestSchema),
      this.controller.updateContent,
    );
    this.delete(
      '/:contentId',
      { name: 'Delete AI Coaching Content' },
      authenticate,
      requireRole('admin'),
      RequestValidator.validate(aiCoachingContentParamsRequestSchema),
      this.controller.deleteContent,
    );
  }
}

export const aiCoachingContentRoute = new AiCoachingContentRoute(aiCoachingContentController);
