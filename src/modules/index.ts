import { Router } from 'express';

import { joinRoutePaths, type ApiRouteDefinition, type RouteModule } from '../common/http/base-route';
import { aiRoute } from './ai/ai.route';
import { authRoute } from './auth/auth.route';
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
  aiRoute,
  hydrationPlanRoute,
  intakeLogRoute,
  nfcTagRoute,
]);

export const apiRouter = apiModuleRegistry.getRouter();
