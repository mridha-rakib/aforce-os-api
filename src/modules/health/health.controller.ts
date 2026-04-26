import { BaseController } from '../../common/http/base-controller';
import { healthService, type HealthService } from './health.service';

export class HealthController extends BaseController {
  public constructor(private readonly service: HealthService) {
    super();
  }

  public readonly getHealthSnapshot = this.handleRequest((_request, response) => {
    this.ok(response, 'Health snapshot fetched successfully.', this.service.getSnapshot());
  });
}

export const healthController = new HealthController(healthService);
