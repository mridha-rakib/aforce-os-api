import { env } from '../../config/env';
import type { HydrationDecisionInput } from './ai.schema';

export interface HydrationDecision {
  consumedMl: number;
  drivers: string[];
  electrolyteRecommendedMl: number;
  engineMode: typeof env.AI_ENGINE_MODE;
  explanation: string;
  hydrationRiskScore: number;
  hydrationTargetMl: number;
  nextAction: {
    amountMl: number;
    reason: string;
    type: 'drink-water' | 'drink-electrolyte' | 'maintain';
  };
  recommendations: string[];
  remainingMl: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'stable' | 'soon' | 'now';
}

const activityAdjustment: Record<HydrationDecisionInput['profile']['activityLevel'], number> = {
  low: 0,
  moderate: 250,
  high: 500,
  elite: 750,
};

const goalAdjustment: Record<HydrationDecisionInput['profile']['goal'], number> = {
  wellness: 0,
  performance: 200,
  recovery: 150,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundToNearest50(value: number): number {
  return Math.round(value / 50) * 50;
}

export class AiService {
  public calculateHydrationDecision(input: HydrationDecisionInput): HydrationDecision {
    const baseTargetMl = this.calculateBaseTarget(input);
    const contextLoadMl = this.calculateContextLoad(input);
    const hydrationTargetMl = roundToNearest50(baseTargetMl + contextLoadMl);
    const consumedMl = input.intakeToday.waterMl + input.intakeToday.electrolyteMl;
    const remainingMl = Math.max(hydrationTargetMl - consumedMl, 0);
    const electrolyteRecommendedMl = this.calculateElectrolyteRecommendation(input, remainingMl);
    const hydrationRiskScore = this.calculateRiskScore(input, hydrationTargetMl, consumedMl);
    const riskLevel = this.mapRiskLevel(hydrationRiskScore);
    const urgency = riskLevel === 'critical' || riskLevel === 'high' ? 'now' : riskLevel === 'medium' ? 'soon' : 'stable';
    const nextAction =
      electrolyteRecommendedMl > 0
        ? {
            amountMl: electrolyteRecommendedMl,
            reason: 'Electrolyte intake is prioritized because strain and sweat signals are elevated.',
            type: 'drink-electrolyte' as const,
          }
        : remainingMl > 0
          ? {
              amountMl: Math.min(remainingMl, 500),
              reason: 'Water intake is the fastest way to close the current hydration gap.',
              type: 'drink-water' as const,
            }
          : {
              amountMl: 0,
              reason: 'Current intake is on track. Maintain steady hydration through the day.',
              type: 'maintain' as const,
            };

    const drivers = this.buildDrivers(input);
    const recommendations = this.buildRecommendations(input, remainingMl, electrolyteRecommendedMl, riskLevel);
    const explanation = `Target ${hydrationTargetMl}ml today based on body mass, activity load, climate, and recent signals. Current risk is ${riskLevel} with ${remainingMl}ml still remaining.`;

    return {
      consumedMl,
      drivers,
      electrolyteRecommendedMl,
      engineMode: env.AI_ENGINE_MODE,
      explanation,
      hydrationRiskScore,
      hydrationTargetMl,
      nextAction,
      recommendations,
      remainingMl,
      riskLevel,
      urgency,
    };
  }

  private buildDrivers(input: HydrationDecisionInput): string[] {
    const drivers = [
      `${input.profile.weightKg}kg body weight baseline`,
      `${input.context.workoutMinutes} workout minutes`,
      `${input.context.ambientTempC}C ambient temperature`,
      `${input.context.humidityPct}% humidity`,
    ];

    if (input.signals.sweatRateDeltaPct !== undefined) {
      drivers.push(`${input.signals.sweatRateDeltaPct}% sweat rate delta`);
    }

    if (input.signals.urineColorScore !== undefined) {
      drivers.push(`urine color score ${input.signals.urineColorScore}`);
    }

    if (input.signals.thirstLevel !== undefined) {
      drivers.push(`thirst level ${input.signals.thirstLevel}`);
    }

    return drivers;
  }

  private buildRecommendations(
    input: HydrationDecisionInput,
    remainingMl: number,
    electrolyteRecommendedMl: number,
    riskLevel: HydrationDecision['riskLevel'],
  ): string[] {
    const recommendations: string[] = [];

    if (electrolyteRecommendedMl > 0) {
      recommendations.push(`Take ${electrolyteRecommendedMl}ml electrolyte-rich fluid in the next 30 minutes.`);
    }

    if (remainingMl > 0 && electrolyteRecommendedMl === 0) {
      recommendations.push(`Drink ${Math.min(remainingMl, 500)}ml plain water now and reassess in 45 minutes.`);
    }

    if (input.context.sleepHours < 6) {
      recommendations.push('Sleep debt is increasing dehydration risk. Reduce aggressive caffeine use today.');
    }

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Trigger an immediate hydration alert and shorten the next check-in interval.');
    }

    if (input.context.workoutMinutes >= 60) {
      recommendations.push('Schedule pre-, intra-, and post-workout hydration reminders for this session.');
    }

    return recommendations;
  }

  private calculateBaseTarget(input: HydrationDecisionInput): number {
    const baselineMl = input.profile.weightKg * 35;
    return baselineMl + activityAdjustment[input.profile.activityLevel] + goalAdjustment[input.profile.goal];
  }

  private calculateContextLoad(input: HydrationDecisionInput): number {
    const temperatureLoad = input.context.ambientTempC > 24 ? (input.context.ambientTempC - 24) * 25 : 0;
    const humidityLoad = input.context.humidityPct > 60 ? (input.context.humidityPct - 60) * 4 : 0;
    const workoutLoad = input.context.workoutMinutes * 12;
    const stepLoad = input.context.steps > 5000 ? Math.floor((input.context.steps - 5000) / 1000) * 20 : 0;
    const sleepLoad = input.context.sleepHours < 7 ? (7 - input.context.sleepHours) * 60 : 0;
    const sweatLoad = input.signals.sweatRateDeltaPct && input.signals.sweatRateDeltaPct > 0 ? input.signals.sweatRateDeltaPct * 5 : 0;
    const urineLoad = input.signals.urineColorScore && input.signals.urineColorScore >= 5 ? input.signals.urineColorScore * 50 : 0;
    const thirstLoad = input.signals.thirstLevel ? input.signals.thirstLevel * 80 : 0;

    return temperatureLoad + humidityLoad + workoutLoad + stepLoad + sleepLoad + sweatLoad + urineLoad + thirstLoad;
  }

  private calculateElectrolyteRecommendation(
    input: HydrationDecisionInput,
    remainingMl: number,
  ): number {
    const elevatedStrain =
      input.context.workoutMinutes >= 45 ||
      (input.signals.sweatRateDeltaPct ?? 0) >= 10 ||
      (input.signals.urineColorScore ?? 0) >= 5;

    if (!elevatedStrain || remainingMl <= 0) {
      return 0;
    }

    return roundToNearest50(Math.min(Math.max(300, input.context.workoutMinutes * 4), remainingMl));
  }

  private calculateRiskScore(
    input: HydrationDecisionInput,
    targetMl: number,
    consumedMl: number,
  ): number {
    const targetGapRatio = targetMl === 0 ? 0 : (targetMl - consumedMl) / targetMl;
    const gapScore = clamp(targetGapRatio * 55, 0, 55);
    const urineScore = ((input.signals.urineColorScore ?? 1) - 1) * 5;
    const thirstScore = (input.signals.thirstLevel ?? 1) * 4;
    const sweatScore = clamp((input.signals.sweatRateDeltaPct ?? 0) * 0.8, 0, 20);
    const sleepScore = input.context.sleepHours < 6 ? 8 : 0;

    return Math.round(clamp(gapScore + urineScore + thirstScore + sweatScore + sleepScore, 0, 100));
  }

  private mapRiskLevel(score: number): HydrationDecision['riskLevel'] {
    if (score >= 80) {
      return 'critical';
    }

    if (score >= 60) {
      return 'high';
    }

    if (score >= 35) {
      return 'medium';
    }

    return 'low';
  }
}

export const aiService = new AiService();
