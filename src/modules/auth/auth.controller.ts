import { BaseController } from '../../common/http/base-controller';
import { authService, type AuthService } from './auth.service';
import type {
  AppleLoginInput,
  GoogleLoginInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  ResendVerificationInput,
  VerifyEmailInput,
} from './auth.schema';

export class AuthController extends BaseController {
  public constructor(private readonly service: AuthService) {
    super();
  }

  public readonly register = this.handleRequest(async (request, response) => {
    const result = await this.service.register(request.body as RegisterInput);
    this.created(response, 'Registration created. Verify your email before login.', result);
  });

  public readonly login = this.handleRequest(async (request, response) => {
    const session = await this.service.login(request.body as LoginInput);
    this.ok(response, 'Login successful.', session);
  });

  public readonly verifyEmail = this.handleRequest(async (request, response) => {
    const user = await this.service.verifyEmail(request.body as VerifyEmailInput);
    this.ok(response, 'Email verified successfully.', user);
  });

  public readonly resendVerification = this.handleRequest(async (request, response) => {
    const result = await this.service.resendVerification(request.body as ResendVerificationInput);
    this.ok(response, 'Verification email sent if the account requires it.', result);
  });

  public readonly refresh = this.handleRequest(async (request, response) => {
    const session = await this.service.refresh(request.body as RefreshInput);
    this.ok(response, 'Token refreshed successfully.', session);
  });

  public readonly logout = this.handleRequest(async (request, response) => {
    await this.service.logout(request.body as LogoutInput);
    this.noContent(response);
  });

  public readonly googleLogin = this.handleRequest(async (request, response) => {
    const session = await this.service.loginWithGoogle(request.body as GoogleLoginInput);
    this.ok(response, 'Google login successful.', session);
  });

  public readonly appleLogin = this.handleRequest(async (request, response) => {
    const session = await this.service.loginWithApple(request.body as AppleLoginInput);
    this.ok(response, 'Apple login successful.', session);
  });

  public readonly me = this.handleRequest(async (request, response) => {
    const user = await this.service.getCurrentUser(request.user?.userId ?? '');
    this.ok(response, 'Current user fetched successfully.', user);
  });
}

export const authController = new AuthController(authService);
