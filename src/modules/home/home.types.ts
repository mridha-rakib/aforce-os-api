export interface HomeUserContext {
  readonly email: string;
  readonly userId: string;
}

export interface HomeHeaderData {
  readonly displayName: string;
  readonly greeting: string;
  readonly notificationRoute: string;
  readonly unreadNotificationCount: number;
}

export interface HomeHydrationScoreData {
  readonly progress: number;
  readonly score: number;
  readonly status: string;
  readonly subtitle: string;
}

export interface HomeStreakDayData {
  readonly completed: boolean;
  readonly label: string;
}

export interface HomeStreakData {
  readonly days: HomeStreakDayData[];
  readonly streakLabel: string;
  readonly title: string;
}

export interface HomeSuggestionData {
  readonly body: string;
  readonly iconName: string;
  readonly title: string;
}

export interface HomeQuickLogActionData {
  readonly iconName: string;
  readonly label: string;
  readonly route: string;
}

export interface HomeQuickLogData {
  readonly actions: HomeQuickLogActionData[];
  readonly title: string;
}

export interface HomeHydrationControlData {
  readonly iconName: string;
  readonly route: string;
  readonly subtitle: string;
  readonly title: string;
}

export interface HomeDailyGoalData {
  readonly currentValue: string;
  readonly percent: number;
  readonly title: string;
  readonly totalValue: string;
  readonly unit: string;
}

export interface HomeMetricData {
  readonly bottomText?: string;
  readonly bottomTextColor?: string;
  readonly dotColor?: string;
  readonly progress?: number;
  readonly title: string;
  readonly type: 'dot-text' | 'progress' | 'text';
  readonly unit?: string;
  readonly value: string;
}

export interface HomeMetricsData {
  readonly items: HomeMetricData[];
}

