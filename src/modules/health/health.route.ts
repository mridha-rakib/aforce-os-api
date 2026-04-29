import { BaseRoute } from '../../common/http/base-route';
import { healthController, type HealthController } from './health.controller';

export class HealthRoute extends BaseRoute {
  public constructor(private readonly controller: HealthController) {
    super('/health', 'public');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.get('/', { name: 'Get API Health' }, this.controller.getHealthSnapshot);
  }
}

export const healthRoute = new HealthRoute(healthController);
