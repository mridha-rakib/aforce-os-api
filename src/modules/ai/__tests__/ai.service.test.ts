import { describe, expect, it } from 'vitest';

import { AiService } from '../ai.service';

describe('AiService', () => {
  it('raises hydration demand for hot, high-strain workouts', () => {
    const service = new AiService();

    const decision = service.calculateHydrationDecision({
      context: {
        ambientTempC: 33,
        humidityPct: 72,
        sleepHours: 5.5,
        steps: 11000,
        workoutMinutes: 75,
      },
      intakeToday: {
        electrolyteMl: 0,
        waterMl: 400,
      },
      profile: {
        activityLevel: 'high',
        goal: 'performance',
        weightKg: 78,
      },
      signals: {
        sweatRateDeltaPct: 18,
        thirstLevel: 4,
        urineColorScore: 6,
      },
      userId: 'user-001',
    });

    expect(decision.hydrationTargetMl).toBeGreaterThan(3500);
    expect(decision.electrolyteRecommendedMl).toBeGreaterThan(0);
    expect(['high', 'critical']).toContain(decision.riskLevel);
  });
});
