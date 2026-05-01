import { BaseRoute } from '../../common/http/base-route';
import { RequestValidator } from '../../common/http/validate-request';
import { authenticate } from '../../common/middleware/auth.middleware';
import { aiController, type AiController } from './ai.controller';
import { hydrationDecisionRequestSchema } from './ai.schema';

export class AiRoute extends BaseRoute {
  public constructor(private readonly controller: AiController) {
    super('/ai');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.post(
      '/hydration-decision',
      { name: 'Get Hydration Decision' },
      authenticate,
      RequestValidator.validate(hydrationDecisionRequestSchema),
      this.controller.getHydrationDecision,
    );
  }
}

export const aiRoute = new AiRoute(aiController);
