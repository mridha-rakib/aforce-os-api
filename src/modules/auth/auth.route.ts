import { BaseRoute } from '../../common/http/base-route';
import { RequestValidator } from '../../common/http/validate-request';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authController, type AuthController } from './auth.controller';
import {
  appleLoginRequestSchema,
  googleLoginRequestSchema,
  loginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
  registerAdminRequestSchema,
  registerRequestSchema,
  resendVerificationRequestSchema,
  verifyEmailRequestSchema,
} from './auth.schema';

export class AuthRoute extends BaseRoute {
  public constructor(private readonly controller: AuthController) {
    super('/auth');
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.post('/register', RequestValidator.validate(registerRequestSchema), this.controller.register);
    this.post(
      '/admin/register',
      RequestValidator.validate(registerAdminRequestSchema),
      this.controller.registerAdmin,
    );
    this.post('/login', RequestValidator.validate(loginRequestSchema), this.controller.login);
    this.post('/verify-email', RequestValidator.validate(verifyEmailRequestSchema), this.controller.verifyEmail);
    this.post(
      '/resend-verification',
      RequestValidator.validate(resendVerificationRequestSchema),
      this.controller.resendVerification,
    );
    this.post('/refresh', RequestValidator.validate(refreshRequestSchema), this.controller.refresh);
    this.post('/logout', RequestValidator.validate(logoutRequestSchema), this.controller.logout);
    this.post('/google', RequestValidator.validate(googleLoginRequestSchema), this.controller.googleLogin);
    this.post('/apple', RequestValidator.validate(appleLoginRequestSchema), this.controller.appleLogin);
    this.get('/me', authenticate, this.controller.me);
  }
}

export const authRoute = new AuthRoute(authController);
