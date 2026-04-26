import { IntakeLogModel } from './intake-log.model';
import type { CreateIntakeLogInput, ListIntakeLogsQuery } from './intake-log.schema';

export class IntakeLogService {
  public async createLog(input: CreateIntakeLogInput): Promise<Record<string, unknown>> {
    const created = new IntakeLogModel({
      amountMl: input.amountMl,
      consumedAt: input.consumedAt ?? new Date(),
      hydrationScoreDelta: input.hydrationScoreDelta,
      source: input.source,
      userId: input.userId,
    });

    if (input.barcodeValue) {
      created.barcodeValue = input.barcodeValue;
    }

    if (input.electrolyteStrength) {
      created.electrolyteStrength = input.electrolyteStrength;
    }

    if (input.nfcTagUid) {
      created.nfcTagUid = input.nfcTagUid.toUpperCase();
    }

    if (input.notes) {
      created.notes = input.notes;
    }

    if (input.productName) {
      created.productName = input.productName;
    }

    if (input.productSku) {
      created.productSku = input.productSku.toUpperCase();
    }

    await created.save();

    return created.toJSON();
  }

  public async listLogs(query: ListIntakeLogsQuery): Promise<Record<string, unknown>> {
    const filters = query.userId ? { userId: query.userId } : {};
    const items = await IntakeLogModel.find(filters)
      .sort({ consumedAt: -1 })
      .limit(query.limit)
      .lean()
      .exec();

    return {
      items,
      total: items.length,
    };
  }
}

export const intakeLogService = new IntakeLogService();
