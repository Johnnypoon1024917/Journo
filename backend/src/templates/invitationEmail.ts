/**
 * Email template for trip invitation
 */
export interface InvitationEmailData {
  recipientName: string;
  inviterName: string;
  tripName: string;
  tripDestination: string;
  invitationLink: string;
}

export function generateInvitationEmailHTML(data: InvitationEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trip Invitation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #6366f1;
      margin: 0;
      font-size: 28px;
    }
    .content {
      margin-bottom: 30px;
    }
    .content p {
      margin: 15px 0;
      font-size: 16px;
    }
    .trip-details {
      background-color: #f8f9fa;
      border-left: 4px solid #6366f1;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .trip-details h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 20px;
    }
    .trip-details p {
      margin: 5px 0;
      color: #666;
    }
    .cta-button {
      display: inline-block;
      background-color: #6366f1;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
    }
    .cta-button:hover {
      background-color: #4f46e5;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .link-fallback {
      word-break: break-all;
      color: #6366f1;
      font-size: 14px;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✈️ You're Invited!</h1>
    </div>
    
    <div class="content">
      <p>Hi ${data.recipientName},</p>
      
      <p><strong>${data.inviterName}</strong> has invited you to join their trip on Journo!</p>
      
      <div class="trip-details">
        <h2>${data.tripName}</h2>
        <p>📍 Destination: ${data.tripDestination}</p>
      </div>
      
      <p>Join the trip to collaborate on planning, share ideas, and make memories together.</p>
      
      <div style="text-align: center;">
        <a href="${data.invitationLink}" class="cta-button">Accept Invitation</a>
      </div>
      
      <p class="link-fallback">
        Or copy and paste this link into your browser:<br>
        ${data.invitationLink}
      </p>
    </div>
    
    <div class="footer">
      <p>This invitation was sent by ${data.inviterName} via Journo.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateInvitationEmailText(data: InvitationEmailData): string {
  return `
You're Invited to Join a Trip on Journo!

Hi ${data.recipientName},

${data.inviterName} has invited you to join their trip:

Trip: ${data.tripName}
Destination: ${data.tripDestination}

Join the trip to collaborate on planning, share ideas, and make memories together.

Accept the invitation by clicking this link:
${data.invitationLink}

---
This invitation was sent by ${data.inviterName} via Journo.
If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
}
