/**
 * Email template for welcome message
 */
export interface WelcomeEmailData {
  userName: string;
  loginLink: string;
}

export function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Journo</title>
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
    .content p {
      margin: 15px 0;
      font-size: 16px;
    }
    .features {
      background-color: #f8f9fa;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .features h3 {
      color: #333;
      margin-top: 0;
    }
    .features ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .features li {
      margin: 8px 0;
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
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Journo!</h1>
    </div>
    
    <div class="content">
      <p>Hi ${data.userName},</p>
      
      <p>Thanks for joining Journo! We're excited to help you plan your next adventure.</p>
      
      <div class="features">
        <h3>What you can do with Journo:</h3>
        <ul>
          <li>📅 Plan trips with day-by-day itineraries</li>
          <li>🗺️ Discover and save amazing places</li>
          <li>👥 Collaborate with friends and family</li>
          <li>💰 Track your budget and expenses</li>
          <li>🎒 Create packing lists</li>
          <li>📸 Share your travel stories</li>
        </ul>
      </div>
      
      <p>Ready to start planning your next trip?</p>
      
      <div style="text-align: center;">
        <a href="${data.loginLink}" class="cta-button">Get Started</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Happy travels! ✈️</p>
      <p>The Journo Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateWelcomeEmailText(data: WelcomeEmailData): string {
  return `
Welcome to Journo!

Hi ${data.userName},

Thanks for joining Journo! We're excited to help you plan your next adventure.

What you can do with Journo:
- Plan trips with day-by-day itineraries
- Discover and save amazing places
- Collaborate with friends and family
- Track your budget and expenses
- Create packing lists
- Share your travel stories

Ready to start planning your next trip?
${data.loginLink}

Happy travels!
The Journo Team
  `.trim();
}
