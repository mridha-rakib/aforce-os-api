import { Router } from 'express';

import { joinRoutePaths, type ApiRouteDefinition, type RouteModule } from '../common/http/base-route';
import { aiRoute } from './ai/ai.route';
import { aiCoachingContentRoute } from './ai-coaching/ai-coaching.route';
import { authRoute } from './auth/auth.route';
import { coachingRoute } from './coaching/coaching.route';
import { contentRoute } from './content/content.route';
import { healthRoute } from './health/health.route';
import { homeRoute } from './home/home.route';
import { hydrationPlanRoute } from './hydration-plans/hydration-plan.route';
import { intakeLogRoute } from './intake-logs/intake-log.route';
import { nfcTagRoute } from './nfc-tags/nfc-tag.route';
import { productRoute } from './products/product.route';
import { storageRoute } from './storage/storage.route';
import { userRoute } from './users/user.route';

export class ApiModuleRegistry {
  private readonly router: Router;

  public constructor(private readonly modules: RouteModule[]) {
    this.router = Router();
    this.registerModules();
  }

  public getRouter(): Router {
    return this.router;
  }

  public getRouteDefinitions(apiPrefix = ''): ApiRouteDefinition[] {
    return this.modules.flatMap((module) =>
      module.getRouteDefinitions().map((route) => ({
        ...route,
        basePath: module.basePath,
        fullPath: joinRoutePaths(apiPrefix, module.basePath, route.path),
      })),
    );
  }

  private registerModules(): void {
    this.modules.forEach((module) => {
      this.router.use(module.basePath, module.router);
    });
  }
}

export const apiModuleRegistry = new ApiModuleRegistry([
  healthRoute,
  authRoute,
  homeRoute,
  coachingRoute,
  aiRoute,
  aiCoachingContentRoute,
  hydrationPlanRoute,
  intakeLogRoute,
  nfcTagRoute,
  userRoute,
  productRoute,
  storageRoute,
  contentRoute,
]);

export const apiRouter = apiModuleRegistry.getRouter();
