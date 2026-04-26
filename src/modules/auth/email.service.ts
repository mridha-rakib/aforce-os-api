import { logger } from '../../common/logger';
import { env } from '../../config/env';

export class EmailService {
  public async sendVerificationEmail(input: {
    readonly email: string;
    readonly token: string;
  }): Promise<void> {
    const verificationUrl = new URL('/auth/verify-email', env.APP_WEB_URL);
    verificationUrl.searchParams.set('token', input.token);

    if (!env.RESEND_API_KEY) {
      logger.info('Email verification link generated', {
        email: input.email,
        verificationUrl: verificationUrl.toString(),
      });
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: input.email,
        subject: 'Verify your AForce email',
        html: `<p>Verify your AForce account by opening this link:</p><p><a href="${verificationUrl.toString()}">${verificationUrl.toString()}</a></p>`,
      }),
    });

    if (!response.ok) {
      logger.error('Unable to send verification email', {
        email: input.email,
        status: response.status,
      });
    }
  }
}

export const emailService = new EmailService();
