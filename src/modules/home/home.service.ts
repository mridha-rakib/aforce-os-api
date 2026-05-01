import {
  intakeLogRepository,
  type IntakeLogRecord,
  type IntakeLogRepository,
} from '../intake-logs/intake-log.repository';
import {
  userRepository,
  type UserRecord,
  type UserRepository,
} from '../users/user.repository';
import { aiService, type AiService } from '../ai/ai.service';
import type {
  HomeDailyGoalData,
  HomeHeaderData,
  HomeHydrationControlData,
  HomeHydrationScoreData,
  HomeMetricsData,
  HomeQuickLogData,
  HomeStreakData,
  HomeSuggestionData,
  HomeUserContext,
} from './home.types';

const DEFAULT_DISPLAY_NAME = 'Alex';
const DEFAULT_DAILY_GOAL_CURRENT_OZ = 1.8;
const DEFAULT_DAILY_GOAL_TOTAL_OZ = 2.7;
const DEFAULT_WEIGHT_KG = 75;
const ML_PER_OUNCE = 29.5735;

export class HomeService {
  public constructor(
    private readonly users: UserRepository,
    private readonly intakeLogs: IntakeLogRepository,
    private readonly ai: AiService,
  ) {}

  public async getHeader(user: HomeUserContext): Promise<HomeHeaderData> {
    const profile = await this.users.findById(user.userId);

    return {
      displayName: this.resolveDisplayName(profile, user.email),
      greeting: this.resolveGreeting(),
      notificationRoute: '/notifications',
      unreadNotificationCount: 0,
    };
  }

  public async getHydrationScore(user: HomeUserContext): Promise<HomeHydrationScoreData> {
    const todayLogs = await this.getTodayLogs(user.userId);
    const score = this.resolveHydrationScore(todayLogs);

    return {
      progress: score === 82 ? 0.8 : score / 100,
      score,
      status: this.resolveHydrationStatus(score),
      subtitle: 'Hydration',
    };
  }

  public async getStreak(): Promise<HomeStreakData> {
    return {
      title: '7 DAY STREAK',
      streakLabel: '\uD83D\uDD25 12 Days',
      days: [
        { label: 'M', completed: true },
        { label: 'T', completed: true },
        { label: 'W', completed: true },
        { label: 'T', completed: false },
        { label: 'F', completed: false },
        { label: 'S', completed: false },
        { label: 'S', completed: false },
      ],
    };
  }

  public async getSuggestion(user: HomeUserContext): Promise<HomeSuggestionData> {
    const todayLogs = await this.getTodayLogs(user.userId);
    const waterMl = this.calculateTodayWaterMl(todayLogs);
    const electrolyteMl = this.calculateTodayElectrolyteMl(todayLogs);
    const decision = await this.ai.generateHydrationDecision({
      context: {
        ambientTempC: 24,
        humidityPct: 55,
        sleepHours: 7,
        steps: 0,
        workoutMinutes: 0,
      },
      intakeToday: {
        electrolyteMl,
        waterMl,
      },
      profile: {
        activityLevel: 'moderate',
        goal: 'wellness',
        weightKg: DEFAULT_WEIGHT_KG,
      },
      signals: {},
      userId: user.userId,
    });

    return {
      title: 'SUGGESTED HYDRATION',
      body: decision.coaching.nextActionText,
      iconName: decision.nextAction.type === 'drink-electrolyte' ? 'flash' : 'beaker-outline',
    };
  }

  public async getQuickLog(): Promise<HomeQuickLogData> {
    return {
      title: 'QUICK LOG',
      actions: [
        {
          iconName: 'water-outline',
          label: 'Water',
          route: '/log/water',
        },
        {
          iconName: 'flash',
          label: 'AForce',
          route: '/log/electrolyte',
        },
      ],
    };
  }

  public async getHydrationControl(): Promise<HomeHydrationControlData> {
    return {
      iconName: 'options-outline',
      route: '/track',
      subtitle: 'Manage targets & bio-sync sensors',
      title: 'Hydration Control Center',
    };
  }

  public async getDailyGoal(user: HomeUserContext): Promise<HomeDailyGoalData> {
    const todayLogs = await this.getTodayLogs(user.userId);
    const loggedOunces = this.calculateTodayOunces(todayLogs);
    const currentValue = loggedOunces > 0 ? loggedOunces : DEFAULT_DAILY_GOAL_CURRENT_OZ;
    const percent = Math.min(100, Math.round((currentValue / DEFAULT_DAILY_GOAL_TOTAL_OZ) * 100));

    return {
      currentValue: this.formatDecimal(currentValue),
      percent,
      title: 'Daily Goal',
      totalValue: this.formatDecimal(DEFAULT_DAILY_GOAL_TOTAL_OZ),
      unit: 'oz',
    };
  }

  public async getMetrics(): Promise<HomeMetricsData> {
    return {
      items: [
        {
          progress: 84,
          title: 'STEPS',
          type: 'progress',
          unit: '/ 10k',
          value: '8,432',
        },
        {
          progress: 60,
          title: 'WORKOUT',
          type: 'progress',
          unit: 'mins',
          value: '45',
        },
        {
          bottomText: 'High Humidity',
          bottomTextColor: '#FFCC00',
          title: 'AMB. TEMP',
          type: 'text',
          value: '24\u00B0F',
        },
        {
          bottomText: 'Resting',
          dotColor: '#00FF66',
          title: 'HEART RATE',
          type: 'dot-text',
          unit: 'bpm',
          value: '72',
        },
      ],
    };
  }

  private async getTodayLogs(userId: string): Promise<IntakeLogRecord[]> {
    const result = await this.intakeLogs.findMany({ limit: 100, userId });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return result.items.filter((log) => log.consumedAt >= todayStart);
  }

  private calculateTodayOunces(logs: IntakeLogRecord[]): number {
    const totalMl = logs.reduce((sum, log) => sum + log.amountMl, 0);

    return totalMl / ML_PER_OUNCE;
  }

  private calculateTodayElectrolyteMl(logs: IntakeLogRecord[]): number {
    return logs
      .filter((log) => log.source === 'electrolyte' || log.electrolyteStrength)
      .reduce((sum, log) => sum + log.amountMl, 0);
  }

  private calculateTodayWaterMl(logs: IntakeLogRecord[]): number {
    return logs
      .filter((log) => log.source !== 'electrolyte' && !log.electrolyteStrength)
      .reduce((sum, log) => sum + log.amountMl, 0);
  }

  private formatDecimal(value: number): string {
    return value.toFixed(1);
  }

  private resolveDisplayName(user: UserRecord | null, email: string): string {
    if (user?.firstName) {
      return user.firstName;
    }

    if (user?.displayName) {
      return user.displayName.split(' ')[0] ?? user.displayName;
    }

    const emailName = email.split('@')[0];

    return emailName || DEFAULT_DISPLAY_NAME;
  }

  private resolveGreeting(): string {
    return 'Good morning,';
  }

  private resolveHydrationScore(logs: IntakeLogRecord[]): number {
    const scoreDelta = logs.reduce((sum, log) => sum + log.hydrationScoreDelta, 0);

    return Math.max(0, Math.min(100, 82 + scoreDelta));
  }

  private resolveHydrationStatus(score: number): string {
    if (score >= 75) {
      return 'OPTIMAL';
    }

    if (score >= 50) {
      return 'MODERATE';
    }

    return 'LOW';
  }
}

export const homeService = new HomeService(userRepository, intakeLogRepository, aiService);
