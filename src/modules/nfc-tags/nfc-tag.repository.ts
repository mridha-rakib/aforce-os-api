import type { HydratedDocument } from 'mongoose';

import { NfcTagModel } from './nfc-tag.model';
import type { NfcTag } from './nfc-tag.model';
import type { RegisterNfcTagInput } from './nfc-tag.schema';

export interface NfcTagRecord {
  batchCode: string;
  createdAt: Date;
  electrolyteBoost: number;
  flavor?: string;
  hydrationBoost: number;
  id: string;
  lastScannedAt?: Date;
  productName: string;
  productSku: string;
  status: 'active' | 'claimed' | 'blocked' | 'retired';
  tagUid: string;
  updatedAt: Date;
  volumeMl: number;
}

interface NfcTagSnapshot extends NfcTag {
  createdAt: Date;
  flavor?: string | null;
  lastScannedAt?: Date | null;
  updatedAt: Date;
}

export class NfcTagRepository {
  public async create(input: RegisterNfcTagInput): Promise<NfcTagRecord> {
    const created = new NfcTagModel({
      batchCode: input.batchCode,
      electrolyteBoost: input.electrolyteBoost,
      hydrationBoost: input.hydrationBoost,
      productName: input.productName,
      productSku: input.productSku.toUpperCase(),
      status: input.status,
      tagUid: input.tagUid.toUpperCase(),
      volumeMl: input.volumeMl,
    });

    if (input.flavor) {
      created.flavor = input.flavor;
    }

    await created.save();

    return this.toRecord(created);
  }

  public async findByUid(tagUid: string): Promise<NfcTagRecord | null> {
    const tag = await NfcTagModel.findOne({ tagUid: tagUid.toUpperCase() }).exec();
    return tag ? this.toRecord(tag) : null;
  }

  public async updateLastScannedAt(tagUid: string, scannedAt: Date): Promise<NfcTagRecord | null> {
    const tag = await NfcTagModel.findOneAndUpdate(
      { tagUid: tagUid.toUpperCase() },
      { $set: { lastScannedAt: scannedAt } },
      { new: true },
    ).exec();

    return tag ? this.toRecord(tag) : null;
  }

  private toRecord(document: HydratedDocument<NfcTag>): NfcTagRecord {
    const snapshot = document.toObject() as NfcTagSnapshot;
    const record: NfcTagRecord = {
      batchCode: snapshot.batchCode,
      createdAt: snapshot.createdAt,
      electrolyteBoost: snapshot.electrolyteBoost,
      hydrationBoost: snapshot.hydrationBoost,
      id: document.id,
      productName: snapshot.productName,
      productSku: snapshot.productSku,
      status: snapshot.status,
      tagUid: snapshot.tagUid,
      updatedAt: snapshot.updatedAt,
      volumeMl: snapshot.volumeMl,
    };

    if (snapshot.flavor) {
      record.flavor = snapshot.flavor;
    }

    if (snapshot.lastScannedAt) {
      record.lastScannedAt = snapshot.lastScannedAt;
    }

    return record;
  }
}

export const nfcTagRepository = new NfcTagRepository();
