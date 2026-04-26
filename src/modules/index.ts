import { Router } from 'express';

import type { RouteModule } from '../common/http/base-route';
import { aiRoute } from './ai/ai.route';
import { healthRoute } from './health/health.route';
import { hydrationPlanRoute } from './hydration-plans/hydration-plan.route';
import { intakeLogRoute } from './intake-logs/intake-log.route';
import { nfcTagRoute } from './nfc-tags/nfc-tag.route';

export class ApiModuleRegistry {
  private readonly router: Router;

  public constructor(private readonly modules: RouteModule[]) {
    this.router = Router();
    this.registerModules();
  }

  public getRouter(): Router {
    return this.router;
  }

  private registerModules(): void {
    this.modules.forEach((module) => {
      this.router.use(module.basePath, module.router);
    });
  }
}

export const apiModuleRegistry = new ApiModuleRegistry([
  healthRoute,
  aiRoute,
  hydrationPlanRoute,
  intakeLogRoute,
  nfcTagRoute,
]);

export const apiRouter = apiModuleRegistry.getRouter();
