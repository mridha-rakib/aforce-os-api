import nodemailer from 'nodemailer';

import { logger } from '../../common/logger';
import { env } from '../../config/env';

function buildCodeEmailHtml(input: {
  readonly code: string;
  readonly intro: string;
  readonly outro: string;
}): string {
  return `<p>${input.intro}</p><p><strong style="font-size:24px;letter-spacing:4px;">${input.code}</strong></p><p>${input.outro}</p>`;
}

export class EmailService {
  public async sendVerificationEmail(input: {
    readonly code: string;
    readonly email: string;
  }): Promise<void> {
    const subject = 'Verify your AForce email';
    const html = buildCodeEmailHtml({
      code: input.code,
      intro: 'Your AForce verification code is:',
      outro: 'This code expires soon. If you did not create an AForce account, you can ignore this email.',
    });

    await this.sendEmail({
      email: input.email,
      html,
      logMessage: 'Verification email sent',
      subject,
    });
  }

  public async sendPasswordResetEmail(input: {
    readonly code: string;
    readonly email: string;
  }): Promise<void> {
    const subject = 'Reset your AForce password';
    const html = buildCodeEmailHtml({
      code: input.code,
      intro: 'Your AForce password reset code is:',
      outro: 'This code expires soon. If you did not request a password reset, you can ignore this email.',
    });

    await this.sendEmail({
      email: input.email,
      html,
      logMessage: 'Password reset email sent',
      subject,
    });
  }

  private hasSmtpConfig(): boolean {
    return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  }

  private async sendEmail(input: {
    readonly email: string;
    readonly html: string;
    readonly logMessage: string;
    readonly subject: string;
  }): Promise<void> {
    if (this.hasSmtpConfig()) {
      await this.sendWithSmtp(input);
      return;
    }

    if (!env.RESEND_API_KEY) {
      logger.info(`${input.logMessage}; email provider not configured`, {
        email: input.email,
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
        html: input.html,
        subject: input.subject,
        to: input.email,
      }),
    });

    if (!response.ok) {
      logger.error('Unable to send email with Resend', {
        email: input.email,
        status: response.status,
        subject: input.subject,
      });
    }
  }

  private async sendWithSmtp(input: {
    readonly email: string;
    readonly html: string;
    readonly logMessage: string;
    readonly subject: string;
  }): Promise<void> {
    const transporter = nodemailer.createTransport({
      auth: {
        pass: env.SMTP_PASS,
        user: env.SMTP_USER,
      },
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
    });

    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        html: input.html,
        subject: input.subject,
        to: input.email,
      });

      logger.info(`${input.logMessage} with SMTP`, {
        email: input.email,
        host: env.SMTP_HOST,
      });
    } catch (error) {
      logger.error('Unable to send email with SMTP', {
        email: input.email,
        error,
        host: env.SMTP_HOST,
        subject: input.subject,
      });

      throw error;
    }
  }
}

export const emailService = new EmailService();
