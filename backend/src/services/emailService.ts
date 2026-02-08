import nodemailer from 'nodemailer';
import { Pool } from 'pg';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private db: Pool;
  private fromEmail: string;
  private fromName: string;
  private baseUrl: string;

  constructor(db: Pool) {
    this.db = db;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@journo.com';
    this.fromName = process.env.FROM_NAME || 'Journo Travel';
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Configure SendGrid for both development and production
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is required');
    }

    this.transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, token: string, firstName?: string): Promise<void> {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${token}`;
    const name = firstName || 'there';

    const template = this.getEmailVerificationTemplate(name, verificationUrl);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    // Log email sent
    await this.logEmailSent(email, 'email_verification', { token });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, token: string, firstName?: string): Promise<void> {
    const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;
    const name = firstName || 'there';

    const template = this.getPasswordResetTemplate(name, resetUrl);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    // Log email sent
    await this.logEmailSent(email, 'password_reset', { token });
  }

  /**
   * Send password change confirmation
   */
  async sendPasswordChangeConfirmation(email: string, firstName?: string): Promise<void> {
    const name = firstName || 'there';
    const template = this.getPasswordChangeConfirmationTemplate(name);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    // Log email sent
    await this.logEmailSent(email, 'password_change_confirmation', {});
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const name = firstName || 'there';
    const template = this.getWelcomeTemplate(name);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    // Log email sent
    await this.logEmailSent(email, 'welcome', {});
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(
    email: string, 
    alertType: string, 
    details: Record<string, any>,
    firstName?: string
  ): Promise<void> {
    const name = firstName || 'there';
    const template = this.getSecurityAlertTemplate(name, alertType, details);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    // Log email sent
    await this.logEmailSent(email, 'security_alert', { alertType, details });
  }

  /**
   * Send invitation link email
   */
  async sendInvitationLink(
    email: string,
    invitationData: {
      tripTitle: string;
      tripDestination: string;
      inviterName: string;
      role: 'editor' | 'viewer';
      invitationUrl: string;
      expiresAt: Date;
      language?: 'en' | 'zh-TW' | 'zh-CN';
    },
    recipientName?: string
  ): Promise<void> {
    const name = recipientName || 'there';
    const language = invitationData.language || 'en';
    const template = this.getInvitationLinkTemplate(name, invitationData, language);
    
    await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    // Log email sent
    await this.logEmailSent(email, 'invitation_link', {
      tripTitle: invitationData.tripTitle,
      role: invitationData.role,
      language
    });
  }

  /**
   * Send generic email
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', info.messageId);
      if (info.response) {
        console.log('SendGrid response:', info.response);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Log email sent to database
   */
  private async logEmailSent(
    email: string, 
    type: string, 
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO email_logs (email, type, metadata, sent_at)
        VALUES ($1, $2, $3, NOW())
      `;
      await this.db.query(query, [email, type, JSON.stringify(metadata)]);
    } catch (error) {
      console.error('Failed to log email:', error);
      // Don't throw error here as email was sent successfully
    }
  }

  // Email Templates
  private getEmailVerificationTemplate(name: string, verificationUrl: string): EmailTemplate {
    const subject = 'Verify your email address - Journo Travel';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Journo Travel!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for signing up for Journo Travel! To complete your registration and start planning amazing trips, please verify your email address.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <p>Happy travels!<br>The Journo Travel Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Journo Travel. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${name},
      
      Thank you for signing up for Journo Travel! To complete your registration, please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with us, please ignore this email.
      
      Happy travels!
      The Journo Travel Team
    `;

    return { subject, html, text };
  }

  private getPasswordResetTemplate(name: string, resetUrl: string): EmailTemplate {
    const subject = 'Reset your password - Journo Travel';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset your password for your Journo Travel account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>This link will expire in 15 minutes for security reasons</li>
                <li>You can only use this link once</li>
                <li>If you didn't request this reset, please ignore this email</li>
              </ul>
            </div>
            <p>For security reasons, we recommend choosing a strong password that includes:</p>
            <ul>
              <li>At least 8 characters</li>
              <li>Uppercase and lowercase letters</li>
              <li>Numbers and special characters</li>
            </ul>
            <p>Best regards,<br>The Journo Travel Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Journo Travel. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${name},
      
      We received a request to reset your password for your Journo Travel account.
      
      Click the link below to reset your password:
      ${resetUrl}
      
      IMPORTANT:
      - This link will expire in 15 minutes for security reasons
      - You can only use this link once
      - If you didn't request this reset, please ignore this email
      
      For security reasons, we recommend choosing a strong password.
      
      Best regards,
      The Journo Travel Team
    `;

    return { subject, html, text };
  }

  private getPasswordChangeConfirmationTemplate(name: string): EmailTemplate {
    const subject = 'Password changed successfully - Journo Travel';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed Successfully</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Your password has been successfully changed for your Journo Travel account.</p>
            <div class="alert">
              <p><strong>If you didn't make this change:</strong></p>
              <p>Please contact our support team immediately at support@journo.com</p>
            </div>
            <p>For your security, all active sessions have been logged out. You'll need to log in again with your new password.</p>
            <p>Best regards,<br>The Journo Travel Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Journo Travel. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${name},
      
      Your password has been successfully changed for your Journo Travel account.
      
      If you didn't make this change, please contact our support team immediately at support@journo.com
      
      For your security, all active sessions have been logged out. You'll need to log in again with your new password.
      
      Best regards,
      The Journo Travel Team
    `;

    return { subject, html, text };
  }

  private getWelcomeTemplate(name: string): EmailTemplate {
    const subject = 'Welcome to Journo Travel!';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Journo Travel!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Welcome to Journo Travel! Your email has been verified and your account is now active.</p>
            <p>You can now start planning your next adventure with our intelligent trip planning tools.</p>
            <a href="${this.baseUrl}/dashboard" class="button">Start Planning</a>
            <p>Here's what you can do with Journo Travel:</p>
            <ul>
              <li>Create personalized trip itineraries</li>
              <li>Discover amazing destinations</li>
              <li>Get weather-based recommendations</li>
              <li>Save and share your favorite places</li>
            </ul>
            <p>Happy travels!<br>The Journo Travel Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Journo Travel. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${name},
      
      Welcome to Journo Travel! Your email has been verified and your account is now active.
      
      You can now start planning your next adventure with our intelligent trip planning tools.
      
      Visit: ${this.baseUrl}/dashboard
      
      Here's what you can do with Journo Travel:
      - Create personalized trip itineraries
      - Discover amazing destinations
      - Get weather-based recommendations
      - Save and share your favorite places
      
      Happy travels!
      The Journo Travel Team
    `;

    return { subject, html, text };
  }

  private getSecurityAlertTemplate(name: string, alertType: string, details: Record<string, any>): EmailTemplate {
    const subject = 'Security Alert - Journo Travel';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Security Alert</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We detected unusual activity on your Journo Travel account.</p>
            <div class="alert">
              <p><strong>Alert Type:</strong> ${alertType}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              ${details.ipAddress ? `<p><strong>IP Address:</strong> ${details.ipAddress}</p>` : ''}
              ${details.location ? `<p><strong>Location:</strong> ${details.location}</p>` : ''}
            </div>
            <p>If this was you, no action is needed. If you don't recognize this activity, please:</p>
            <ul>
              <li>Change your password immediately</li>
              <li>Review your account activity</li>
              <li>Contact our support team</li>
            </ul>
            <p>Best regards,<br>The Journo Travel Security Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Journo Travel. All rights reserved.</p>
            <p>This is an automated security alert.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${name},
      
      We detected unusual activity on your Journo Travel account.
      
      Alert Type: ${alertType}
      Time: ${new Date().toLocaleString()}
      ${details.ipAddress ? `IP Address: ${details.ipAddress}` : ''}
      ${details.location ? `Location: ${details.location}` : ''}
      
      If this was you, no action is needed. If you don't recognize this activity, please:
      - Change your password immediately
      - Review your account activity
      - Contact our support team
      
      Best regards,
      The Journo Travel Security Team
    `;

    return { subject, html, text };
  }

  private getInvitationLinkTemplate(
    name: string,
    data: {
      tripTitle: string;
      tripDestination: string;
      inviterName: string;
      role: 'editor' | 'viewer';
      invitationUrl: string;
      expiresAt: Date;
    },
    language: 'en' | 'zh-TW' | 'zh-CN'
  ): EmailTemplate {
    // Translations
    const translations = {
      en: {
        subject: `You're invited to collaborate on ${data.tripTitle}`,
        greeting: `Hi ${name},`,
        inviteMessage: `${data.inviterName} has invited you to collaborate on their trip to ${data.tripDestination}!`,
        roleLabel: 'Your Role',
        roleEditor: 'Editor - You can view and edit trip content',
        roleViewer: 'Viewer - You can view trip content',
        tripLabel: 'Trip',
        destinationLabel: 'Destination',
        expiresLabel: 'Invitation Expires',
        acceptButton: 'Accept Invitation',
        orCopy: 'Or copy and paste this link into your browser:',
        expiresNote: 'This invitation link will expire on',
        notYouMessage: "If you didn't expect this invitation, you can safely ignore this email.",
        happyTravels: 'Happy travels!',
        teamSignature: 'The Journo Travel Team',
        footerCopyright: '© 2024 Journo Travel. All rights reserved.',
        footerAutomated: 'This is an automated email. Please do not reply.'
      },
      'zh-TW': {
        subject: `邀請您協作 ${data.tripTitle}`,
        greeting: `嗨 ${name}，`,
        inviteMessage: `${data.inviterName} 邀請您協作他們前往 ${data.tripDestination} 的旅程！`,
        roleLabel: '您的角色',
        roleEditor: '編輯者 - 您可以查看和編輯旅程內容',
        roleViewer: '檢視者 - 您可以查看旅程內容',
        tripLabel: '旅程',
        destinationLabel: '目的地',
        expiresLabel: '邀請到期時間',
        acceptButton: '接受邀請',
        orCopy: '或複製此連結並貼到瀏覽器：',
        expiresNote: '此邀請連結將於以下時間到期',
        notYouMessage: '如果您沒有預期收到此邀請，可以安全地忽略此郵件。',
        happyTravels: '祝旅途愉快！',
        teamSignature: 'Journo Travel 團隊',
        footerCopyright: '© 2024 Journo Travel. 版權所有。',
        footerAutomated: '這是一封自動發送的郵件，請勿回覆。'
      },
      'zh-CN': {
        subject: `邀请您协作 ${data.tripTitle}`,
        greeting: `嗨 ${name}，`,
        inviteMessage: `${data.inviterName} 邀请您协作他们前往 ${data.tripDestination} 的旅程！`,
        roleLabel: '您的角色',
        roleEditor: '编辑者 - 您可以查看和编辑旅程内容',
        roleViewer: '查看者 - 您可以查看旅程内容',
        tripLabel: '旅程',
        destinationLabel: '目的地',
        expiresLabel: '邀请到期时间',
        acceptButton: '接受邀请',
        orCopy: '或复制此链接并粘贴到浏览器：',
        expiresNote: '此邀请链接将于以下时间到期',
        notYouMessage: '如果您没有预期收到此邀请，可以安全地忽略此邮件。',
        happyTravels: '祝旅途愉快！',
        teamSignature: 'Journo Travel 团队',
        footerCopyright: '© 2024 Journo Travel. 版权所有。',
        footerAutomated: '这是一封自动发送的邮件，请勿回复。'
      }
    };

    const t = translations[language];
    const roleText = data.role === 'editor' ? t.roleEditor : t.roleViewer;
    const expiresDate = data.expiresAt.toLocaleString(language === 'en' ? 'en-US' : language === 'zh-TW' ? 'zh-TW' : 'zh-CN');

    const subject = t.subject;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content { 
            padding: 40px 30px; 
          }
          .content h2 {
            color: #333;
            font-size: 20px;
            margin-top: 0;
          }
          .trip-info {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .trip-info p {
            margin: 8px 0;
            font-size: 15px;
          }
          .trip-info strong {
            color: #667eea;
            display: inline-block;
            min-width: 120px;
          }
          .role-badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-left: 10px;
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important; 
            padding: 16px 40px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 25px 0;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
          }
          .button:hover {
            box-shadow: 0 6px 8px rgba(102, 126, 234, 0.4);
            transform: translateY(-2px);
          }
          .link-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            word-break: break-all;
            font-size: 14px;
            color: #667eea;
            margin: 15px 0;
          }
          .expires-notice {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 14px;
          }
          .expires-notice strong {
            color: #856404;
          }
          .footer { 
            background: #f8f9fa; 
            padding: 30px 20px; 
            text-align: center; 
            font-size: 14px; 
            color: #666; 
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 5px 0;
          }
          @media only screen and (max-width: 600px) {
            .content {
              padding: 30px 20px;
            }
            .header h1 {
              font-size: 24px;
            }
            .button {
              display: block;
              text-align: center;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ ${t.tripLabel}</h1>
          </div>
          <div class="content">
            <h2>${t.greeting}</h2>
            <p style="font-size: 16px; line-height: 1.8;">${t.inviteMessage}</p>
            
            <div class="trip-info">
              <p><strong>${t.tripLabel}:</strong> ${data.tripTitle}</p>
              <p><strong>${t.destinationLabel}:</strong> ${data.tripDestination}</p>
              <p><strong>${t.roleLabel}:</strong> <span class="role-badge">${roleText}</span></p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.invitationUrl}" class="button">${t.acceptButton}</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">${t.orCopy}</p>
            <div class="link-box">
              <a href="${data.invitationUrl}" style="color: #667eea; text-decoration: none;">${data.invitationUrl}</a>
            </div>
            
            <div class="expires-notice">
              <p><strong>⏰ ${t.expiresLabel}:</strong> ${expiresDate}</p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">${t.notYouMessage}</p>
            
            <p style="margin-top: 30px;">${t.happyTravels}<br><strong>${t.teamSignature}</strong></p>
          </div>
          <div class="footer">
            <p>${t.footerCopyright}</p>
            <p>${t.footerAutomated}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${t.greeting}
      
      ${t.inviteMessage}
      
      ${t.tripLabel}: ${data.tripTitle}
      ${t.destinationLabel}: ${data.tripDestination}
      ${t.roleLabel}: ${roleText}
      
      ${t.acceptButton}:
      ${data.invitationUrl}
      
      ${t.expiresLabel}: ${expiresDate}
      
      ${t.notYouMessage}
      
      ${t.happyTravels}
      ${t.teamSignature}
    `;

    return { subject, html, text };
  }
}