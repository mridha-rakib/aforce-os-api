import { BaseController } from '../../common/http/base-controller';
import type { HydrationPlanInput } from './hydration-plan.schema';
import {
  hydrationPlanService,
  type HydrationPlanService,
} from './hydration-plan.service';

export class HydrationPlanController extends BaseController {
  public constructor(private readonly service: HydrationPlanService) {
    super();
  }

  public readonly generatePlan = this.handleRequest((request, response) => {
    const plan = this.service.generatePlan(request.body as HydrationPlanInput);
    this.ok(response, 'Hydration plan generated successfully.', plan);
  });
}

export const hydrationPlanController = new HydrationPlanController(hydrationPlanService);
