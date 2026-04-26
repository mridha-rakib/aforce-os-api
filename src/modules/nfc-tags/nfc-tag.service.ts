import {
  ConflictAppError,
  ResourceNotFoundError,
} from '../../common/errors/http-errors';
import { NfcTagModel } from './nfc-tag.model';
import type { RegisterNfcTagInput, ScanNfcTagInput } from './nfc-tag.schema';

export class NfcTagService {
  public async getTagByUid(tagUid: string): Promise<Record<string, unknown>> {
    const tag = await NfcTagModel.findOne({ tagUid: tagUid.toUpperCase() }).lean().exec();

    if (!tag) {
      throw new ResourceNotFoundError('NFC tag', { tagUid });
    }

    return tag;
  }

  public async registerTag(input: RegisterNfcTagInput): Promise<Record<string, unknown>> {
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

    return created.toJSON();
  }

  public async resolveScan(input: ScanNfcTagInput): Promise<Record<string, unknown>> {
    const tag = await NfcTagModel.findOne({ tagUid: input.tagUid.toUpperCase() }).exec();

    if (!tag) {
      throw new ResourceNotFoundError('NFC tag', { tagUid: input.tagUid });
    }

    if (tag.status === 'blocked' || tag.status === 'retired') {
      throw new ConflictAppError(
        `NFC tag "${tag.tagUid}" cannot be used for hydration logging while its status is "${tag.status}".`,
        { status: tag.status, tagUid: tag.tagUid },
        'Reactivate the tag or scan a different active product tag.',
      );
    }

    tag.lastScannedAt = input.scannedAt ?? new Date();
    await tag.save();

    return {
      scanAccepted: true,
      tag: tag.toObject(),
      userId: input.userId,
      nextAction: 'create-intake-log',
      hydrationImpact: {
        hydrationBoost: tag.hydrationBoost,
        electrolyteBoost: tag.electrolyteBoost,
      },
    };
  }
}

export const nfcTagService = new NfcTagService();
