/**
 * Manual Test Script for Invitation Link Email
 * 
 * This script allows you to manually test the invitation link email functionality
 * by sending test emails to a specified address.
 * 
 * Usage:
 *   ts-node backend/test_invitation_email.ts <recipient-email> [language]
 * 
 * Examples:
 *   ts-node backend/test_invitation_email.ts test@example.com en
 *   ts-node backend/test_invitation_email.ts test@example.com zh-TW
 *   ts-node backend/test_invitation_email.ts test@example.com zh-CN
 */

import { EmailService } from './src/services/emailService';
import pool from './src/config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test data for different languages
const testData = {
  en: {
    tripTitle: 'Tokyo Adventure 2024',
    tripDestination: 'Tokyo, Japan',
    inviterName: 'John Doe',
    recipientName: 'Jane Smith',
    role: 'editor' as const,
    language: 'en' as const
  },
  'zh-TW': {
    tripTitle: '東京冒險 2024',
    tripDestination: '日本東京',
    inviterName: '張三',
    recipientName: '李四',
    role: 'editor' as const,
    language: 'zh-TW' as const
  },
  'zh-CN': {
    tripTitle: '东京冒险 2024',
    tripDestination: '日本东京',
    inviterName: '张三',
    recipientName: '李四',
    role: 'editor' as const,
    language: 'zh-CN' as const
  }
};

async function testInvitationEmail() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Error: Please provide a recipient email address');
    console.log('\nUsage:');
    console.log('  ts-node backend/test_invitation_email.ts <recipient-email> [language]');
    console.log('\nExamples:');
    console.log('  ts-node backend/test_invitation_email.ts test@example.com en');
    console.log('  ts-node backend/test_invitation_email.ts test@example.com zh-TW');
    console.log('  ts-node backend/test_invitation_email.ts test@example.com zh-CN');
    process.exit(1);
  }

  const recipientEmail = args[0];
  const language = (args[1] || 'en') as 'en' | 'zh-TW' | 'zh-CN';

  // Validate language
  if (!['en', 'zh-TW', 'zh-CN'].includes(language)) {
    console.error(`❌ Error: Invalid language "${language}". Must be one of: en, zh-TW, zh-CN`);
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.error(`❌ Error: Invalid email address "${recipientEmail}"`);
    process.exit(1);
  }

  // Check required environment variables
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ Error: SENDGRID_API_KEY environment variable is not set');
    console.log('Please set it in your .env file or environment');
    process.exit(1);
  }

  console.log('\n🚀 Starting Invitation Email Test\n');
  console.log('Configuration:');
  console.log(`  Recipient: ${recipientEmail}`);
  console.log(`  Language: ${language}`);
  console.log(`  From: ${process.env.FROM_EMAIL || 'noreply@journo.com'}`);
  console.log(`  Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('');

  try {
    // Initialize email service
    const emailService = new EmailService(pool);

    // Get test data for the selected language
    const data = testData[language];

    // Generate test invitation URL
    const testToken = 'test-token-' + Math.random().toString(36).substring(7);
    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${testToken}`;

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    console.log('📧 Sending invitation email...\n');
    console.log('Email Details:');
    console.log(`  Trip: ${data.tripTitle}`);
    console.log(`  Destination: ${data.tripDestination}`);
    console.log(`  Inviter: ${data.inviterName}`);
    console.log(`  Recipient: ${data.recipientName}`);
    console.log(`  Role: ${data.role}`);
    console.log(`  Expires: ${expiresAt.toLocaleString()}`);
    console.log(`  URL: ${invitationUrl}`);
    console.log('');

    // Send the email
    await emailService.sendInvitationLink(
      recipientEmail,
      {
        tripTitle: data.tripTitle,
        tripDestination: data.tripDestination,
        inviterName: data.inviterName,
        role: data.role,
        invitationUrl: invitationUrl,
        expiresAt: expiresAt,
        language: data.language
      },
      data.recipientName
    );

    console.log('✅ Email sent successfully!\n');
    console.log('Next steps:');
    console.log('  1. Check the recipient inbox: ' + recipientEmail);
    console.log('  2. Check spam/junk folder if not in inbox');
    console.log('  3. Verify the email displays correctly');
    console.log('  4. Test the "Accept Invitation" button');
    console.log('  5. Verify responsive design on mobile');
    console.log('');

    // Test all three languages if no language specified
    if (args.length === 1) {
      console.log('💡 Tip: You can test other languages:');
      console.log(`  ts-node backend/test_invitation_email.ts ${recipientEmail} zh-TW`);
      console.log(`  ts-node backend/test_invitation_email.ts ${recipientEmail} zh-CN`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error sending email:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the test
testInvitationEmail().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
