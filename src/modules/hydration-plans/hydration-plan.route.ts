import { BaseRoute } from '../../common/http/base-route';
import { RequestValidator } from '../../common/http/validate-request';
import {
  hydrationPlanController,
  type HydrationPlanController,
} from './hydration-plan.controller';
import { hydrationPlanRequestSchema } from './hydration-plan.schema';

export class HydrationPlanRoute extends BaseRoute {
  public constructor(private readonly controller: HydrationPlanController) {
    super('/hydration-plans');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.post(
      '/generate',
      RequestValidator.validate(hydrationPlanRequestSchema),
      this.controller.generatePlan,
    );
  }
}

export const hydrationPlanRoute = new HydrationPlanRoute(hydrationPlanController);
