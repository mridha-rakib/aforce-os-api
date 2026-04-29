import { BaseRoute } from '../../common/http/base-route';
import { RequestValidator } from '../../common/http/validate-request';
import { intakeLogController, type IntakeLogController } from './intake-log.controller';
import { createIntakeLogRequestSchema, listIntakeLogsRequestSchema } from './intake-log.schema';

export class IntakeLogRoute extends BaseRoute {
  public constructor(private readonly controller: IntakeLogController) {
    super('/intake-logs');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.post(
      '/',
      { name: 'Create Intake Log' },
      RequestValidator.validate(createIntakeLogRequestSchema),
      this.controller.createLog,
    );
    this.get(
      '/',
      { name: 'List Intake Logs' },
      RequestValidator.validate(listIntakeLogsRequestSchema),
      this.controller.listLogs,
    );
  }
}

export const intakeLogRoute = new IntakeLogRoute(intakeLogController);
