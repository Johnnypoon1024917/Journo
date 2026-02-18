import sgMail from '@sendgrid/mail';
import logger from '../utils/logger.js';
import {
  generateInvitationEmailHTML,
  generateInvitationEmailText,
  InvitationEmailData,
} from '../templates/invitationEmail.js';
import {
  generateWelcomeEmailHTML,
  generateWelcomeEmailText,
  WelcomeEmailData,
} from '../templates/welcomeEmail.js';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@journo.app';
const FROM_NAME = process.env.FROM_NAME || 'Journo';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  logger.info('SendGrid email service initialized');
} else {
  logger.warn('SENDGRID_API_KEY not configured - email sending disabled');
}

export class EmailService {
  /**
   * Send an email using SendGrid
   */
  private static async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<boolean> {
    if (!SENDGRID_API_KEY) {
      logger.warn(`Email sending disabled - would have sent to ${to}: ${subject}`);
      return false;
    }

    try {
      await sgMail.send({
        to,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        subject,
        html,
        text,
      });

      logger.info(`Email sent successfully to ${to}: ${subject}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send email:', {
        to,
        subject,
        error: error.message,
        response: error.response?.body,
      });
      return false;
    }
  }

  /**
   * Send trip invitation email
   */
  static async sendInvitationEmail(
    recipientEmail: string,
    data: InvitationEmailData
  ): Promise<boolean> {
    const subject = `${data.inviterName} invited you to join a trip on Journo`;
    const html = generateInvitationEmailHTML(data);
    const text = generateInvitationEmailText(data);

    return this.sendEmail(recipientEmail, subject, html, text);
  }

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(
    recipientEmail: string,
    data: WelcomeEmailData
  ): Promise<boolean> {
    const subject = 'Welcome to Journo - Start Planning Your Next Adventure!';
    const html = generateWelcomeEmailHTML(data);
    const text = generateWelcomeEmailText(data);

    return this.sendEmail(recipientEmail, subject, html, text);
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    recipientEmail: string,
    userName: string,
    resetLink: string
  ): Promise<boolean> {
    const subject = 'Reset Your Journo Password';
    const html = `
      <h1>Password Reset Request</h1>
      <p>Hi ${userName},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;
    const text = `
      Password Reset Request
      
      Hi ${userName},
      
      We received a request to reset your password. Click the link below to create a new password:
      ${resetLink}
      
      If you didn't request this, you can safely ignore this email.
      This link will expire in 1 hour.
    `;

    return this.sendEmail(recipientEmail, subject, html, text);
  }

  /**
   * Send notification email
   */
  static async sendNotificationEmail(
    recipientEmail: string,
    userName: string,
    notificationTitle: string,
    notificationMessage: string,
    actionLink?: string
  ): Promise<boolean> {
    const subject = `Journo: ${notificationTitle}`;
    const html = `
      <h1>${notificationTitle}</h1>
      <p>Hi ${userName},</p>
      <p>${notificationMessage}</p>
      ${actionLink ? `<p><a href="${actionLink}">View Details</a></p>` : ''}
    `;
    const text = `
      ${notificationTitle}
      
      Hi ${userName},
      
      ${notificationMessage}
      ${actionLink ? `\nView Details: ${actionLink}` : ''}
    `;

    return this.sendEmail(recipientEmail, subject, html, text);
  }
}

export default EmailService;
