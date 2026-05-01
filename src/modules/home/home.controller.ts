import { AuthenticationAppError } from '../../common/errors/http-errors';
import { BaseController } from '../../common/http/base-controller';
import { homeService, type HomeService } from './home.service';
import type { HomeUserContext } from './home.types';

export class HomeController extends BaseController {
  public constructor(private readonly service: HomeService) {
    super();
  }

  public readonly getHeader = this.handleRequest(async (request, response) => {
    const header = await this.service.getHeader(this.getUserContext(request.user));
    this.ok(response, 'Home header fetched successfully.', header);
  });

  public readonly getHydrationScore = this.handleRequest(async (request, response) => {
    const score = await this.service.getHydrationScore(this.getUserContext(request.user));
    this.ok(response, 'Home hydration score fetched successfully.', score);
  });

  public readonly getStreak = this.handleRequest(async (request, response) => {
    this.getUserContext(request.user);
    const streak = await this.service.getStreak();
    this.ok(response, 'Home streak fetched successfully.', streak);
  });

  public readonly getSuggestion = this.handleRequest(async (request, response) => {
    const suggestion = await this.service.getSuggestion(this.getUserContext(request.user));
    this.ok(response, 'Home suggestion fetched successfully.', suggestion);
  });

  public readonly getQuickLog = this.handleRequest(async (request, response) => {
    this.getUserContext(request.user);
    const quickLog = await this.service.getQuickLog();
    this.ok(response, 'Home quick log fetched successfully.', quickLog);
  });

  public readonly getHydrationControl = this.handleRequest(async (request, response) => {
    this.getUserContext(request.user);
    const hydrationControl = await this.service.getHydrationControl();
    this.ok(response, 'Home hydration control fetched successfully.', hydrationControl);
  });

  public readonly getDailyGoal = this.handleRequest(async (request, response) => {
    const dailyGoal = await this.service.getDailyGoal(this.getUserContext(request.user));
    this.ok(response, 'Home daily goal fetched successfully.', dailyGoal);
  });

  public readonly getMetrics = this.handleRequest(async (request, response) => {
    this.getUserContext(request.user);
    const metrics = await this.service.getMetrics();
    this.ok(response, 'Home metrics fetched successfully.', metrics);
  });

  private getUserContext(user: Express.AuthenticatedUser | undefined): HomeUserContext {
    if (!user) {
      throw new AuthenticationAppError('Authentication is required.');
    }

    return {
      email: user.email,
      userId: user.userId,
    };
  }
}

export const homeController = new HomeController(homeService);
