import { BaseController } from '../../common/http/base-controller';
import type { HydrationDecisionInput } from './ai.schema';
import { aiService, type AiService } from './ai.service';

export class AiController extends BaseController {
  public constructor(private readonly service: AiService) {
    super();
  }

  public readonly getHydrationDecision = this.handleRequest((request, response) => {
    const decision = this.service.calculateHydrationDecision(request.body as HydrationDecisionInput);
    this.ok(response, 'Hydration decision generated successfully.', decision);
  });
}

export const aiController = new AiController(aiService);
