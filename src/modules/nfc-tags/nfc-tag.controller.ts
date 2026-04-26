import { BaseController } from '../../common/http/base-controller';
import type { RegisterNfcTagInput, ScanNfcTagInput } from './nfc-tag.schema';
import { nfcTagService, type NfcTagService } from './nfc-tag.service';

export class NfcTagController extends BaseController {
  public constructor(private readonly service: NfcTagService) {
    super();
  }

  public readonly getByUid = this.handleRequest(async (request, response) => {
    const tag = await this.service.getTagByUid(request.params.tagUid as string);
    this.ok(response, 'NFC tag fetched successfully.', tag);
  });

  public readonly register = this.handleRequest(async (request, response) => {
    const tag = await this.service.registerTag(request.body as RegisterNfcTagInput);
    this.created(response, 'NFC tag registered successfully.', tag);
  });

  public readonly resolveScan = this.handleRequest(async (request, response) => {
    const scanResult = await this.service.resolveScan(request.body as ScanNfcTagInput);
    this.ok(response, 'NFC tag scan resolved successfully.', scanResult);
  });
}

export const nfcTagController = new NfcTagController(nfcTagService);
