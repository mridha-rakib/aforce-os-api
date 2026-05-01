import { AuthenticationAppError } from '../../common/errors/http-errors';
import { BaseController } from '../../common/http/base-controller';
import type { CoachingContentParams } from './coaching.schema';
import { coachingService, type CoachingService } from './coaching.service';

export class CoachingController extends BaseController {
  public constructor(private readonly service: CoachingService) {
    super();
  }

  public readonly getFeed = this.handleRequest(async (request, response) => {
    this.ensureAuthenticated(request.user);
    const feed = await this.service.getFeed(request.query);
    this.ok(response, 'Coaching feed fetched successfully.', feed);
  });

  public readonly getContent = this.handleRequest(async (request, response) => {
    this.ensureAuthenticated(request.user);
    const content = await this.service.getContent((request.params as CoachingContentParams).contentId);
    this.ok(response, 'Coaching content fetched successfully.', content);
  });

  private ensureAuthenticated(user: Express.AuthenticatedUser | undefined): void {
    if (!user) {
      throw new AuthenticationAppError('Authentication is required.');
    }
  }
}

export const coachingController = new CoachingController(coachingService);
