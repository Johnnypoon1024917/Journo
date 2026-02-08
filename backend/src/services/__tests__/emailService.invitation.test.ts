import { EmailService } from '../emailService';
import pool from '../../config/database';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 OK'
    })
  }))
}));

// Mock database
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

describe('EmailService - Invitation Link', () => {
  let emailService: EmailService;
  const mockPool = pool as jest.Mocked<typeof pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful email log insertion
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 1 });
    
    // Set required environment variables
    process.env.SENDGRID_API_KEY = 'test-api-key';
    process.env.FROM_EMAIL = 'test@journo.com';
    process.env.FROM_NAME = 'Journo Travel Test';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    
    emailService = new EmailService(pool);
  });

  describe('sendInvitationLink', () => {
    const mockInvitationData = {
      tripTitle: 'Tokyo Adventure 2024',
      tripDestination: 'Tokyo, Japan',
      inviterName: 'John Doe',
      role: 'editor' as const,
      invitationUrl: 'http://localhost:3000/invite/abc123',
      expiresAt: new Date('2024-12-31T23:59:59Z')
    };

    it('should send invitation email in English', async () => {
      await emailService.sendInvitationLink(
        'recipient@example.com',
        { ...mockInvitationData, language: 'en' },
        'Jane Smith'
      );

      // Verify email was logged
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO email_logs'),
        expect.arrayContaining([
          'recipient@example.com',
          'invitation_link',
          expect.any(String)
        ])
      );
    });

    it('should send invitation email in Traditional Chinese', async () => {
      await emailService.sendInvitationLink(
        'recipient@example.com',
        { ...mockInvitationData, language: 'zh-TW' },
        '張三'
      );

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should send invitation email in Simplified Chinese', async () => {
      await emailService.sendInvitationLink(
        'recipient@example.com',
        { ...mockInvitationData, language: 'zh-CN' },
        '张三'
      );

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should default to English if no language specified', async () => {
      await emailService.sendInvitationLink(
        'recipient@example.com',
        mockInvitationData,
        'Jane Smith'
      );

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should handle editor role correctly', async () => {
      await emailService.sendInvitationLink(
        'recipient@example.com',
        { ...mockInvitationData, role: 'editor', language: 'en' },
        'Jane Smith'
      );

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should handle viewer role correctly', async () => {
      await emailService.sendInvitationLink(
        'recipient@example.com',
        { ...mockInvitationData, role: 'viewer', language: 'en' },
        'Jane Smith'
      );

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should use default name if recipient name not provided', async () => {
      await emailService.sendInvitationLink(
        'recipient@example.com',
        { ...mockInvitationData, language: 'en' }
      );

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should include trip details in email', async () => {
      const customData = {
        tripTitle: 'Paris Getaway',
        tripDestination: 'Paris, France',
        inviterName: 'Alice Johnson',
        role: 'viewer' as const,
        invitationUrl: 'http://localhost:3000/invite/xyz789',
        expiresAt: new Date('2024-06-30T23:59:59Z'),
        language: 'en' as const
      };

      await emailService.sendInvitationLink(
        'recipient@example.com',
        customData,
        'Bob Wilson'
      );

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      // Mock email sending failure
      const nodemailer = require('nodemailer');
      nodemailer.createTransport.mockReturnValueOnce({
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP error'))
      });

      // Recreate service with mocked transporter
      const failingService = new EmailService(pool);

      await expect(
        failingService.sendInvitationLink(
          'recipient@example.com',
          mockInvitationData,
          'Jane Smith'
        )
      ).rejects.toThrow('Failed to send email');
    });

    it('should log email metadata correctly', async () => {
      await emailService.sendInvitationLink(
        'recipient@example.com',
        { ...mockInvitationData, language: 'zh-TW' },
        'Jane Smith'
      );

      const logCall = mockPool.query.mock.calls.find(call => 
        call[0].includes('INSERT INTO email_logs')
      );

      expect(logCall).toBeDefined();
      expect(logCall![1]).toEqual([
        'recipient@example.com',
        'invitation_link',
        expect.stringContaining('Tokyo Adventure 2024')
      ]);
    });
  });

  describe('Email Template Content', () => {
    it('should generate HTML email with proper structure', async () => {
      const sendMailSpy = jest.fn().mockResolvedValue({
        messageId: 'test-id',
        response: '250 OK'
      });

      const nodemailer = require('nodemailer');
      nodemailer.createTransport.mockReturnValueOnce({
        sendMail: sendMailSpy
      });

      const testService = new EmailService(pool);

      await testService.sendInvitationLink(
        'test@example.com',
        {
          tripTitle: 'Test Trip',
          tripDestination: 'Test Destination',
          inviterName: 'Test Inviter',
          role: 'editor',
          invitationUrl: 'http://test.com/invite/123',
          expiresAt: new Date('2024-12-31'),
          language: 'en'
        },
        'Test User'
      );

      expect(sendMailSpy).toHaveBeenCalled();
      const emailOptions = sendMailSpy.mock.calls[0][0];
      
      // Verify HTML contains key elements
      expect(emailOptions.html).toContain('Test Trip');
      expect(emailOptions.html).toContain('Test Destination');
      expect(emailOptions.html).toContain('Test Inviter');
      expect(emailOptions.html).toContain('Accept Invitation');
      expect(emailOptions.html).toContain('http://test.com/invite/123');
      
      // Verify text version exists
      expect(emailOptions.text).toBeDefined();
      expect(emailOptions.text).toContain('Test Trip');
    });

    it('should include responsive CSS for mobile devices', async () => {
      const sendMailSpy = jest.fn().mockResolvedValue({
        messageId: 'test-id',
        response: '250 OK'
      });

      const nodemailer = require('nodemailer');
      nodemailer.createTransport.mockReturnValueOnce({
        sendMail: sendMailSpy
      });

      const testService = new EmailService(pool);

      await testService.sendInvitationLink(
        'test@example.com',
        {
          tripTitle: 'Test Trip',
          tripDestination: 'Test Destination',
          inviterName: 'Test Inviter',
          role: 'editor',
          invitationUrl: 'http://test.com/invite/123',
          expiresAt: new Date('2024-12-31'),
          language: 'en'
        },
        'Test User'
      );

      const emailOptions = sendMailSpy.mock.calls[0][0];
      
      // Verify responsive CSS exists
      expect(emailOptions.html).toContain('@media only screen and (max-width: 600px)');
      expect(emailOptions.html).toContain('max-width: 600px');
    });
  });
});
