import type { HydratedDocument } from 'mongoose';

import { IntakeLogModel } from './intake-log.model';
import type { IntakeLog } from './intake-log.model';
import type { CreateIntakeLogInput, ListIntakeLogsQuery } from './intake-log.schema';

export interface IntakeLogRecord {
  amountMl: number;
  barcodeValue?: string;
  consumedAt: Date;
  createdAt: Date;
  electrolyteStrength?: 'low' | 'medium' | 'high';
  hydrationScoreDelta: number;
  id: string;
  nfcTagUid?: string;
  notes?: string;
  productName?: string;
  productSku?: string;
  source: 'water' | 'electrolyte' | 'nfc' | 'barcode' | 'manual';
  updatedAt: Date;
  userId: string;
}

export interface IntakeLogListResult {
  items: IntakeLogRecord[];
  total: number;
}

interface IntakeLogSnapshot extends IntakeLog {
  barcodeValue?: string | null;
  createdAt: Date;
  electrolyteStrength?: 'low' | 'medium' | 'high' | null;
  nfcTagUid?: string | null;
  notes?: string | null;
  productName?: string | null;
  productSku?: string | null;
  updatedAt: Date;
}

export class IntakeLogRepository {
  public async create(input: CreateIntakeLogInput): Promise<IntakeLogRecord> {
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

    return this.toRecord(created);
  }

  public async findMany(query: ListIntakeLogsQuery): Promise<IntakeLogListResult> {
    const filters = query.userId ? { userId: query.userId } : {};

    const [documents, total] = await Promise.all([
      IntakeLogModel.find(filters).sort({ consumedAt: -1 }).limit(query.limit).exec(),
      IntakeLogModel.countDocuments(filters).exec(),
    ]);

    return {
      items: documents.map((document) => this.toRecord(document)),
      total,
    };
  }

  private toRecord(document: HydratedDocument<IntakeLog>): IntakeLogRecord {
    const snapshot = document.toObject() as IntakeLogSnapshot;
    const record: IntakeLogRecord = {
      amountMl: snapshot.amountMl,
      consumedAt: snapshot.consumedAt,
      createdAt: snapshot.createdAt,
      hydrationScoreDelta: snapshot.hydrationScoreDelta,
      id: document.id,
      source: snapshot.source,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };

    if (snapshot.barcodeValue) {
      record.barcodeValue = snapshot.barcodeValue;
    }

    if (snapshot.electrolyteStrength) {
      record.electrolyteStrength = snapshot.electrolyteStrength;
    }

    if (snapshot.nfcTagUid) {
      record.nfcTagUid = snapshot.nfcTagUid;
    }

    if (snapshot.notes) {
      record.notes = snapshot.notes;
    }

    if (snapshot.productName) {
      record.productName = snapshot.productName;
    }

    if (snapshot.productSku) {
      record.productSku = snapshot.productSku;
    }

    return record;
  }
}

export const intakeLogRepository = new IntakeLogRepository();
