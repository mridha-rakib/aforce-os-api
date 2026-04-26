import { aiService } from '../ai/ai.service';
import type { HydrationPlanInput } from './hydration-plan.schema';

export class HydrationPlanService {
  public generatePlan(input: HydrationPlanInput): Record<string, unknown> {
    const decision = aiService.calculateHydrationDecision({
      context: input.context,
      intakeToday: input.intakeToday,
      profile: input.profile,
      signals: {},
      userId: input.userId,
    });

    const workoutStartHour = input.context.workoutStartHour;
    const morningTarget = Math.round(decision.hydrationTargetMl * 0.35);
    const daytimeTarget = Math.round(decision.hydrationTargetMl * 0.30);
    const eveningTarget = decision.hydrationTargetMl - morningTarget - daytimeTarget;

    const timeline = [
      {
        label: 'Morning hydration',
        notes: 'Start with a front-loaded water block after waking.',
        targetMl: morningTarget,
        window: `${String(input.context.wakeHour).padStart(2, '0')}:00 - ${String(input.context.wakeHour + 3).padStart(2, '0')}:00`,
      },
      {
        label: 'Daytime maintenance',
        notes: 'Spread intake across work blocks and daily activity.',
        targetMl: daytimeTarget,
        window: '12:00 - 17:00',
      },
      {
        label: 'Evening recovery',
        notes: 'Close the remaining gap without overloading late at night.',
        targetMl: eveningTarget,
        window: '17:00 - 21:00',
      },
    ];

    if (workoutStartHour !== undefined) {
      timeline.splice(1, 0, {
        label: 'Workout hydration',
        notes: 'Increase electrolyte concentration around training.',
        targetMl: Math.max(decision.electrolyteRecommendedMl, 300),
        window: `${String(Math.max(workoutStartHour - 1, 0)).padStart(2, '0')}:00 - ${String(Math.min(workoutStartHour + 1, 23)).padStart(2, '0')}:00`,
      });
    }

    return {
      decision,
      timeline,
    };
  }
}

export const hydrationPlanService = new HydrationPlanService();
