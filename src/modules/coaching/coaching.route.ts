import { BaseRoute } from '../../common/http/base-route';
import { RequestValidator } from '../../common/http/validate-request';
import { authenticate } from '../../common/middleware/auth.middleware';
import { coachingController, type CoachingController } from './coaching.controller';
import {
  coachingContentParamsRequestSchema,
  coachingFeedRequestSchema,
} from './coaching.schema';

export class CoachingRoute extends BaseRoute {
  public constructor(private readonly controller: CoachingController) {
    super('/coaching');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.get(
      '/feed',
      { audience: 'user', name: 'Get Coaching Feed' },
      authenticate,
      RequestValidator.validate(coachingFeedRequestSchema),
      this.controller.getFeed,
    );
    this.get(
      '/:contentId',
      { audience: 'user', name: 'Get Coaching Content' },
      authenticate,
      RequestValidator.validate(coachingContentParamsRequestSchema),
      this.controller.getContent,
    );
  }
}

export const coachingRoute = new CoachingRoute(coachingController);
