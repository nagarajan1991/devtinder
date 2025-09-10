const { run: sendEmail } = require("./sendEmail");

// Base email template with consistent styling
const getBaseTemplate = (title, content, ctaText = null, ctaUrl = null) => {
  const webUrl = process.env.WEB_BASE_URL || "http://localhost:5173";
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 32px 24px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .content {
          padding: 32px 24px;
        }
        
        .content h2 {
          color: #1f2937;
          font-size: 24px;
          margin-bottom: 16px;
          font-weight: 600;
        }
        
        .content p {
          color: #4b5563;
          font-size: 16px;
          margin-bottom: 16px;
        }
        
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 24px 0;
          transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
        }
        
        .footer {
          background-color: #f9fafb;
          padding: 24px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        
        .social-links {
          margin-top: 16px;
        }
        
        .social-links a {
          display: inline-block;
          margin: 0 8px;
          color: #6b7280;
          text-decoration: none;
        }
        
        .user-card {
          background-color: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .user-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .user-info h3 {
          color: #1f2937;
          font-size: 18px;
          margin-bottom: 4px;
        }
        
        .user-info p {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin: 24px 0;
        }
        
        .stat-item {
          text-align: center;
          padding: 16px;
          background-color: #f8fafc;
          border-radius: 8px;
        }
        
        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
        }
        
        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
        
        @media (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          
          .header, .content, .footer {
            padding: 24px 16px;
          }
          
          .user-card {
            flex-direction: column;
            text-align: center;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Social Network</h1>
          <p>Connect with amazing people</p>
        </div>
        
        <div class="content">
          ${content}
          
          ${ctaText && ctaUrl ? `
            <div style="text-align: center; margin-top: 32px;">
              <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>This email was sent by Social Network</p>
          <p>If you have any questions, feel free to <a href="mailto:support@socialnetworkdummy.com">contact our support team</a></p>
          
          <div class="social-links">
            <a href="${webUrl}">Visit Social Network</a>
            <a href="${webUrl}/premium">Go Premium</a>
            <a href="${webUrl}/connections">My Connections</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Welcome email template for new users
const getWelcomeEmailTemplate = (userName) => {
  const webUrl = process.env.WEB_BASE_URL || "http://localhost:5173";
  
  const content = `
    <h2>Welcome to Social Network, ${userName}! 🎉</h2>
    
    <p>We're thrilled to have you join our community of amazing people! You're now part of a platform where people connect, collaborate, and build amazing things together.</p>
    
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-number">1000+</div>
        <div class="stat-label">Active Users</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">500+</div>
        <div class="stat-label">Successful Connections</div>
      </div>
    </div>
    
    <h3>What you can do on Social Network:</h3>
    <ul style="color: #4b5563; margin: 16px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">🔍 Discover people with similar interests and skills</li>
      <li style="margin-bottom: 8px;">💬 Chat with potential collaborators and friends</li>
      <li style="margin-bottom: 8px;">📚 Share knowledge and learn from others</li>
      <li style="margin-bottom: 8px;">⭐ Build your network</li>
    </ul>
    
    <p><strong>Pro Tip:</strong> Complete your profile with a great photo and detailed skills to get more connection requests!</p>
  `;
  
  return getBaseTemplate(
    "Welcome to Social Network!",
    content,
    "Complete Your Profile",
    `${webUrl}/profile/edit`
  );
};

// Connection request email template
const getConnectionRequestTemplate = (fromUser, toUser, status) => {
  const webUrl = process.env.WEB_BASE_URL || "http://localhost:5173";
  const actionText = status === "interested" ? "wants to connect with you" : "has shown interest in your profile";
  
  const content = `
    <h2>New Connection Request! 👋</h2>
    
    <p>Great news! Someone wants to connect with you on Social Network.</p>
    
    <div class="user-card">
      <img src="${fromUser.photoUrl || 'https://geographyandyou.com/images/user-profile.png'}" 
           alt="${fromUser.firstName}" class="user-avatar">
      <div class="user-info">
        <h3>${fromUser.firstName} ${fromUser.lastName || ''}</h3>
        <p>${fromUser.about || 'User looking to connect'}</p>
        ${fromUser.skills && fromUser.skills.length > 0 ? `
          <p style="margin-top: 8px;">
            <strong>Skills:</strong> ${fromUser.skills.slice(0, 3).join(', ')}${fromUser.skills.length > 3 ? '...' : ''}
          </p>
        ` : ''}
      </div>
    </div>
    
    <p>${fromUser.firstName} ${actionText}. Don't miss out on this potential collaboration or friendship!</p>
    
    <p><strong>What's next?</strong> Review their profile and decide if you'd like to connect. You can start a conversation once you accept their request.</p>
  `;
  
  return getBaseTemplate(
    "New Connection Request on Social Network",
    content,
    "View & Respond to Request",
    `${webUrl}/connections`
  );
};

// Daily digest email template
const getDailyDigestTemplate = (userEmail, pendingCount, recentConnections = []) => {
  const webUrl = process.env.WEB_BASE_URL || "http://localhost:5173";
  
  const content = `
    <h2>Your Social Network Daily Digest 📊</h2>
    
    <p>Here's what's happening in your Social Network today!</p>
    
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-number">${pendingCount}</div>
        <div class="stat-label">Pending Requests</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${recentConnections.length}</div>
        <div class="stat-label">New Connections</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">24h</div>
        <div class="stat-label">Activity Window</div>
      </div>
    </div>
    
    ${pendingCount > 0 ? `
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="color: #92400e; margin-bottom: 8px;">⏰ Action Required</h3>
        <p style="color: #92400e; margin: 0;">You have <strong>${pendingCount} pending connection request${pendingCount > 1 ? 's' : ''}</strong> waiting for your response. Don't keep potential collaborators waiting!</p>
      </div>
    ` : ''}
    
    ${recentConnections.length > 0 ? `
      <h3>Recent Connections</h3>
      <p>Here are some of your recent connections:</p>
      ${recentConnections.map(conn => `
        <div class="user-card">
          <img src="${conn.photoUrl || 'https://geographyandyou.com/images/user-profile.png'}" 
               alt="${conn.firstName}" class="user-avatar">
          <div class="user-info">
            <h3>${conn.firstName} ${conn.lastName || ''}</h3>
            <p>Connected ${conn.connectedAt}</p>
          </div>
        </div>
      `).join('')}
    ` : ''}
    
    <p><strong>Stay active!</strong> Regular engagement helps you build stronger connections and discover new opportunities.</p>
  `;
  
  return getBaseTemplate(
    "Your Social Network Daily Digest",
    content,
    pendingCount > 0 ? "Review Pending Requests" : "Browse New Connections",
    `${webUrl}/connections`
  );
};

// Premium upgrade email template
const getPremiumUpgradeTemplate = (userName, membershipType) => {
  const webUrl = process.env.WEB_BASE_URL || "http://localhost:5173";
  
  const content = `
    <h2>Welcome to ${membershipType.charAt(0).toUpperCase() + membershipType.slice(1)} Membership! ⭐</h2>
    
    <p>Congratulations, ${userName}! You've successfully upgraded to our ${membershipType} plan. You now have access to premium features that will supercharge your Social Network experience.</p>
    
    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-bottom: 12px;">🎉 Your Premium Benefits:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">💬 Unlimited chat with all connections</li>
        <li style="margin-bottom: 8px;">🚀 Unlimited daily decisions on the feed</li>
        <li style="margin-bottom: 8px;">⭐ Priority visibility in search results</li>
        <li style="margin-bottom: 8px;">📊 Advanced profile analytics</li>
        <li style="margin-bottom: 8px;">🎯 Enhanced matching algorithm</li>
      </ul>
    </div>
    
    <p><strong>Membership Details:</strong></p>
    <ul style="color: #4b5563; margin: 16px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Plan: ${membershipType.charAt(0).toUpperCase() + membershipType.slice(1)}</li>
      <li style="margin-bottom: 8px;">Duration: 30 days</li>
      <li style="margin-bottom: 8px;">Auto-renewal: Enabled</li>
    </ul>
    
    <p>Start exploring your new premium features and make the most of your Social Network experience!</p>
  `;
  
  return getBaseTemplate(
    "Welcome to Premium!",
    content,
    "Explore Premium Features",
    `${webUrl}/premium`
  );
};

// Email sending functions
const sendWelcomeEmail = async (userEmail, userName) => {
  const subject = `Welcome to Social Network, ${userName}! 🎉`;
  const htmlBody = getWelcomeEmailTemplate(userName);
  const textBody = `Welcome to Social Network, ${userName}! We're excited to have you join our community of people. Visit ${process.env.WEB_BASE_URL || "http://localhost:5173"} to get started.`;
  
  return await sendEmail(subject, htmlBody, userEmail, undefined, textBody);
};

const sendConnectionRequestEmail = async (fromUser, toUser, status) => {
  const subject = `New Connection Request from ${fromUser.firstName} on Social Network `;
  const htmlBody = getConnectionRequestTemplate(fromUser, toUser, status);
  const textBody = `${fromUser.firstName} ${status === "interested" ? "wants to connect with you" : "has shown interest in your profile"} on Social Network. Visit ${process.env.WEB_BASE_URL || "http://localhost:5173"}/connections to respond.`;
  
  return await sendEmail(subject, htmlBody, toUser.emailId, undefined, textBody);
};

const sendDailyDigestEmail = async (userEmail, pendingCount, recentConnections = []) => {
  const subject = `Your Social Network Daily Digest - ${pendingCount} pending request${pendingCount !== 1 ? 's' : ''}`;
  const htmlBody = getDailyDigestTemplate(userEmail, pendingCount, recentConnections);
  const textBody = `Your Social Network Daily Digest: ${pendingCount} pending connection request${pendingCount !== 1 ? 's' : ''}. Visit ${process.env.WEB_BASE_URL || "http://localhost:5173"}/connections to review.`;
  
  return await sendEmail(subject, htmlBody, userEmail, undefined, textBody);
};

const sendPremiumUpgradeEmail = async (userEmail, userName, membershipType) => {
  const subject = `Welcome to ${membershipType.charAt(0).toUpperCase() + membershipType.slice(1)} Membership! ⭐`;
  const htmlBody = getPremiumUpgradeTemplate(userName, membershipType);
  const textBody = `Congratulations ${userName}! You've successfully upgraded to ${membershipType} membership on Social Network. Enjoy your premium features!`;
  
  return await sendEmail(subject, htmlBody, userEmail, undefined, textBody);
};

// Password reset email template
const getPasswordResetTemplate = (userName, resetToken) => {
  const webUrl = process.env.WEB_BASE_URL || "http://localhost:5173";
  const resetUrl = `${webUrl}/reset-password?token=${resetToken}`;
  
  const content = `
    <h2>Password Reset Request 🔐</h2>
    
    <p>Hi ${userName},</p>
    
    <p>We received a request to reset your password for your Social Network account. If you didn't make this request, you can safely ignore this email.</p>
    
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #92400e; margin-bottom: 8px;">⚠️ Important Security Notice</h3>
      <p style="color: #92400e; margin: 0;">This password reset link will expire in <strong>15 minutes</strong> for your security.</p>
    </div>
    
    <p><strong>To reset your password:</strong></p>
    <ol style="color: #4b5563; margin: 16px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Click the "Reset Password" button below</li>
      <li style="margin-bottom: 8px;">Enter your new password (must be strong and secure)</li>
      <li style="margin-bottom: 8px;">Confirm your new password</li>
      <li style="margin-bottom: 8px;">You'll be redirected to login with your new password</li>
    </ol>
    
    <p><strong>Password Requirements:</strong></p>
    <ul style="color: #4b5563; margin: 16px 0; padding-left: 20px;">
      <li style="margin-bottom: 4px;">At least 8 characters long</li>
      <li style="margin-bottom: 4px;">Contains uppercase and lowercase letters</li>
      <li style="margin-bottom: 4px;">Contains at least one number</li>
      <li style="margin-bottom: 4px;">Contains at least one special character</li>
    </ul>
    
    <p>If you're having trouble with the button above, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6b7280; background-color: #f3f4f6; padding: 8px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
  `;
  
  return getBaseTemplate(
    "Reset Your Password",
    content,
    "Reset Password",
    resetUrl
  );
};

const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const subject = "Reset Your Password - Social Network";
  const htmlBody = getPasswordResetTemplate(userName, resetToken);
  const textBody = `Hi ${userName}, you requested a password reset for your Social Network account. Click this link to reset your password: ${process.env.WEB_BASE_URL || "http://localhost:5173"}/reset-password?token=${resetToken}. This link expires in 15 minutes.`;
  
  return await sendEmail(subject, htmlBody, userEmail, undefined, textBody);
};

// Email Verification Template
const getEmailVerificationTemplate = (userName, verificationToken) => {
  const verificationUrl = `${process.env.WEB_BASE_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
  
  const content = `
    <h2>Welcome to Social Network! 🎉</h2>
    
    <p>Hi ${userName},</p>
    
    <p>Thank you for signing up for Social Network! We're excited to have you join our community of people and connect with others.</p>
    
    <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #0369a1; margin-bottom: 8px;">📧 Verify Your Email Address</h3>
      <p style="color: #0369a1; margin: 0;">To complete your registration and start connecting with other people, please verify your email address by clicking the button below.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
        ✨ Verify My Email Address
      </a>
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #92400e; margin-bottom: 8px;">⚠️ Important</h3>
      <p style="color: #92400e; margin: 0;">This verification link will expire in <strong>24 hours</strong>. If you don't verify your email within this time, you'll need to request a new verification email.</p>
    </div>

    <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 14px; background-color: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0;">${verificationUrl}</p>

    <p>Once verified, you'll be able to:</p>
    <ul style="color: #333; line-height: 1.6;">
      <li>🔍 Discover and connect with other people</li>
      <li>💬 Chat with your connections</li>
      <li>📱 Access premium features</li>
      <li>🌐 Build your social network</li>
    </ul>

    <p>If you didn't create an account with Social Network, you can safely ignore this email.</p>

    <p>Welcome aboard!</p>
    <p><strong>The Social Network Team</strong></p>
  `;

  return getBaseTemplate(
    "Verify Your Email Address",
    content,
    "Verify Email",
    verificationUrl
  );
};

const sendEmailVerificationEmail = async (userEmail, userName, verificationToken) => {
  const subject = "Verify Your Email Address - Social Network";
  const htmlBody = getEmailVerificationTemplate(userName, verificationToken);
  const textBody = `Hi ${userName}, welcome to Social Network! Please verify your email address by clicking this link: ${process.env.WEB_BASE_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}. This link expires in 24 hours.`;
  
  return await sendEmail(subject, htmlBody, userEmail, undefined, textBody);
};

module.exports = {
  getBaseTemplate,
  getWelcomeEmailTemplate,
  getConnectionRequestTemplate,
  getDailyDigestTemplate,
  getPremiumUpgradeTemplate,
  getPasswordResetTemplate,
  getEmailVerificationTemplate,
  sendWelcomeEmail,
  sendConnectionRequestEmail,
  sendDailyDigestEmail,
  sendPremiumUpgradeEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail
};
