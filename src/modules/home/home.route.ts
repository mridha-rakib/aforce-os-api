import { BaseRoute } from '../../common/http/base-route';
import { authenticate } from '../../common/middleware/auth.middleware';
import { homeController, type HomeController } from './home.controller';

export class HomeRoute extends BaseRoute {
  public constructor(private readonly controller: HomeController) {
    super('/home');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.get('/header', { name: 'Get Home Header' }, authenticate, this.controller.getHeader);
    this.get('/hydration-score', { name: 'Get Home Hydration Score' }, authenticate, this.controller.getHydrationScore);
    this.get('/streak', { name: 'Get Home Streak' }, authenticate, this.controller.getStreak);
    this.get('/suggestion', { name: 'Get Home Hydration Suggestion' }, authenticate, this.controller.getSuggestion);
    this.get('/quick-log', { name: 'Get Home Quick Log' }, authenticate, this.controller.getQuickLog);
    this.get(
      '/hydration-control',
      { name: 'Get Home Hydration Control' },
      authenticate,
      this.controller.getHydrationControl,
    );
    this.get('/daily-goal', { name: 'Get Home Daily Goal' }, authenticate, this.controller.getDailyGoal);
    this.get('/metrics', { name: 'Get Home Metrics' }, authenticate, this.controller.getMetrics);
  }
}

export const homeRoute = new HomeRoute(homeController);

