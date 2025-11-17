import { Resend } from "resend";

// Get Resend client factory function
const getResendClient = (apiKey) => {
  if (!apiKey || apiKey === "demo_key_for_testing") {
    return null; // Don't create client without valid API key
  }
  return new Resend(apiKey);
};

export class EmailService {
  constructor(env) {
    this.env = env;
    this.resend = getResendClient(env.RESEND_API_KEY);
    this.fromEmail = env.FROM_EMAIL || "noreply@farmersboot.com";
    this.appName = "Farmers Boot";
    this.baseUrl = env.APP_URL || "http://localhost:3000";
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail, resetToken) {
    try {
      const resetLink = `${this.baseUrl}/reset-password?token=${resetToken}`;

      // Always try to send real emails - no development fallback
      if (!this.env.RESEND_API_KEY) {
        console.log("❌ EMAIL SETUP REQUIRED");
        console.log("📧 Cannot send emails without RESEND_API_KEY");
        console.log("🔧 To enable email sending:");
        console.log("   1. Get free API key from: https://resend.com");
        console.log(
          "   2. Add to functions/.env: RESEND_API_KEY=re_your_key_here"
        );
        console.log("   3. Restart the development server");
        console.log("");
        console.log("📧 Test email that would be sent to:", userEmail);
        console.log("🔗 Reset link:", resetLink);
        throw new Error(
          "Email service not configured. Please setup RESEND_API_KEY."
        );
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - ${this.appName}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
              .warning { background: #fef3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌱 ${this.appName}</h1>
                <p>Password Reset Request</p>
              </div>
              
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>Hello,</p>
                <p>We received a request to reset the password for your ${this.appName} account.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace;">
                  ${resetLink}
                </p>
                
                <div class="warning">
                  <strong>⚠️ Important Security Notes:</strong>
                  <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>For your security, please don't share this email with anyone</li>
                    <li>If you didn't request this password reset, please ignore this email</li>
                  </ul>
                </div>
                
                <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
                <p>${resetLink}</p>
              </div>
              
              <div class="footer">
                <p>This email was sent by ${this.appName}</p>
                <p>If you have any questions, contact our support team.</p>
                <p>© 2025 ${this.appName}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const emailText = `
        ${this.appName} - Password Reset Request
        
        Hello,
        
        We received a request to reset the password for your ${this.appName} account.
        
        Click the link below to reset your password:
        ${resetLink}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
        
        If you're having trouble, copy and paste the URL above into your web browser.
        
        ---
        This email was sent by ${this.appName}
        © 2025 ${this.appName}. All rights reserved.
      `;

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [userEmail],
        subject: `Password Reset - ${this.appName}`,
        html: emailHtml,
        text: emailText,
      });

      console.log(`✅ REAL EMAIL SENT to ${userEmail}`);
      console.log(`📧 Email ID: ${result.data?.id}`);
      console.log(`🔗 Reset link: ${resetLink}`);
      return { success: true, emailId: result.data?.id };
    } catch (error) {
      console.error("❌ FAILED to send real email:", error);
      throw new Error(`Real email sending failed: ${error.message}`);
    }
  }

  /**
   * Send welcome email for new registrations
   */
  async sendWelcomeEmail(userEmail, userName) {
    try {
      // Always try to send real emails - no development fallback
      if (!this.env.RESEND_API_KEY) {
        console.log("❌ EMAIL SETUP REQUIRED for welcome emails");
        throw new Error(
          "Email service not configured. Please setup RESEND_API_KEY."
        );
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to ${this.appName}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌱 Welcome to ${this.appName}!</h1>
              </div>
              
              <div class="content">
                <h2>Hi ${userName},</h2>
                <p>Welcome to ${this.appName}! We're excited to have you on board.</p>
                <p>You can now access all the features to manage your farm operations effectively.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${this.baseUrl}/dashboard" class="button">Go to Dashboard</a>
                </div>
                
                <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
                
                <p>Happy farming! 🚜</p>
              </div>
              
              <div class="footer">
                <p>© 2025 ${this.appName}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [userEmail],
        subject: `Welcome to ${this.appName}!`,
        html: emailHtml,
      });

      console.log(`✅ Welcome email sent successfully to ${userEmail}`);
      return { success: true, emailId: result.data?.id };
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error);
      throw new Error(`Welcome email sending failed: ${error.message}`);
    }
  }

  /**
   * Test email connectivity
   */
  async testEmailConnection() {
    try {
      if (!this.env.RESEND_API_KEY) {
        console.warn(
          "RESEND_API_KEY not configured - email functionality will be disabled"
        );
        return { success: false, error: "Email service not configured" };
      }

      // Simple test to verify API key works
      const result = await this.resend.domains.list();
      return {
        success: true,
        domains: result.data?.length || 0,
        message: "Email service is properly configured",
      };
    } catch (error) {
      console.error("Email service test failed:", error);
      return {
        success: false,
        error: error.message,
        message: "Email service configuration issue",
      };
    }
  }
}
