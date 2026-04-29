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
    this.post(
      '/register',
      { name: 'Register User Account' },
      RequestValidator.validate(registerRequestSchema),
      this.controller.register,
    );
    this.post(
      '/login',
      { name: 'Log In With Email' },
      RequestValidator.validate(loginRequestSchema),
      this.controller.login,
    );
    this.post(
      '/verify-email',
      { name: 'Verify Email Address' },
      RequestValidator.validate(verifyEmailRequestSchema),
      this.controller.verifyEmail,
    );
    this.post(
      '/resend-verification',
      { name: 'Resend Verification Email' },
      RequestValidator.validate(resendVerificationRequestSchema),
      this.controller.resendVerification,
    );
    this.post(
      '/refresh',
      { name: 'Refresh Access Token' },
      RequestValidator.validate(refreshRequestSchema),
      this.controller.refresh,
    );
    this.post(
      '/logout',
      { name: 'Log Out' },
      RequestValidator.validate(logoutRequestSchema),
      this.controller.logout,
    );
    this.post(
      '/google',
      { name: 'Log In With Google' },
      RequestValidator.validate(googleLoginRequestSchema),
      this.controller.googleLogin,
    );
    this.post(
      '/apple',
      { name: 'Log In With Apple' },
      RequestValidator.validate(appleLoginRequestSchema),
      this.controller.appleLogin,
    );
    this.get('/me', { name: 'Get Current User' }, authenticate, this.controller.me);
  }
}

export const authRoute = new AuthRoute(authController);
