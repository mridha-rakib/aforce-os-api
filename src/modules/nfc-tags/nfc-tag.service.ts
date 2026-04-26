import {
  ConflictAppError,
  ResourceNotFoundError,
} from '../../common/errors/http-errors';
import {
  nfcTagRepository,
  type NfcTagRecord,
  type NfcTagRepository,
} from './nfc-tag.repository';
import type { RegisterNfcTagInput, ScanNfcTagInput } from './nfc-tag.schema';

export class NfcTagService {
  public constructor(private readonly repository: NfcTagRepository) {}

  public async getTagByUid(tagUid: string): Promise<NfcTagRecord> {
    const tag = await this.repository.findByUid(tagUid);

    if (!tag) {
      throw new ResourceNotFoundError('NFC tag', { tagUid });
    }

    return tag;
  }

  public async registerTag(input: RegisterNfcTagInput): Promise<NfcTagRecord> {
    return this.repository.create(input);
  }

  public async resolveScan(input: ScanNfcTagInput): Promise<Record<string, unknown>> {
    const tag = await this.repository.findByUid(input.tagUid);

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

    const updatedTag = await this.repository.updateLastScannedAt(
      tag.tagUid,
      input.scannedAt ?? new Date(),
    );

    if (!updatedTag) {
      throw new ResourceNotFoundError('NFC tag', { tagUid: input.tagUid });
    }

    return {
      scanAccepted: true,
      tag: updatedTag,
      userId: input.userId,
      nextAction: 'create-intake-log',
      hydrationImpact: {
        hydrationBoost: updatedTag.hydrationBoost,
        electrolyteBoost: updatedTag.electrolyteBoost,
      },
    };
  }
}

export const nfcTagService = new NfcTagService(nfcTagRepository);
