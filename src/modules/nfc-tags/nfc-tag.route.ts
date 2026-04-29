import { BaseRoute } from '../../common/http/base-route';
import { RequestValidator } from '../../common/http/validate-request';
import { nfcTagController, type NfcTagController } from './nfc-tag.controller';
import {
  getNfcTagRequestSchema,
  registerNfcTagRequestSchema,
  scanNfcTagRequestSchema,
} from './nfc-tag.schema';

export class NfcTagRoute extends BaseRoute {
  public constructor(private readonly controller: NfcTagController) {
    super('/nfc-tags');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.post(
      '/register',
      { name: 'Register NFC Tag' },
      RequestValidator.validate(registerNfcTagRequestSchema),
      this.controller.register,
    );
    this.post(
      '/scan',
      { name: 'Resolve NFC Scan' },
      RequestValidator.validate(scanNfcTagRequestSchema),
      this.controller.resolveScan,
    );
    this.get(
      '/:tagUid',
      { name: 'Get NFC Tag By UID' },
      RequestValidator.validate(getNfcTagRequestSchema),
      this.controller.getByUid,
    );
  }
}

export const nfcTagRoute = new NfcTagRoute(nfcTagController);
