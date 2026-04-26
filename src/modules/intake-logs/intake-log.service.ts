import {
  intakeLogRepository,
  type IntakeLogListResult,
  type IntakeLogRecord,
  type IntakeLogRepository,
} from './intake-log.repository';
import type { CreateIntakeLogInput, ListIntakeLogsQuery } from './intake-log.schema';

export class IntakeLogService {
  public constructor(private readonly repository: IntakeLogRepository) {}

  public async createLog(input: CreateIntakeLogInput): Promise<IntakeLogRecord> {
    return this.repository.create(input);
  }

  public async listLogs(query: ListIntakeLogsQuery): Promise<IntakeLogListResult> {
    return this.repository.findMany(query);
  }
}

export const intakeLogService = new IntakeLogService(intakeLogRepository);
