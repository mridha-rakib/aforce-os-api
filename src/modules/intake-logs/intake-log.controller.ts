import { BaseController } from '../../common/http/base-controller';
import type { CreateIntakeLogInput, ListIntakeLogsQuery } from './intake-log.schema';
import { intakeLogService, type IntakeLogService } from './intake-log.service';

export class IntakeLogController extends BaseController {
  public constructor(private readonly service: IntakeLogService) {
    super();
  }

  public readonly createLog = this.handleRequest(async (request, response) => {
    const intakeLog = await this.service.createLog(request.body as CreateIntakeLogInput);
    this.created(response, 'Intake log created successfully.', intakeLog);
  });

  public readonly listLogs = this.handleRequest(async (request, response) => {
    const logs = await this.service.listLogs(request.query as unknown as ListIntakeLogsQuery);
    this.ok(response, 'Intake logs fetched successfully.', logs);
  });
}

export const intakeLogController = new IntakeLogController(intakeLogService);
