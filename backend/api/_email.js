// `resend` client is created lazily at runtime to avoid import-time
// access of `process.env` which can leak Node-only patterns into the
// Worker bundle. The actual client is dynamically imported when we
// have a valid API key in the runtime `env`.

// NOTE: No top-level import of `resend` here.

export class EmailService {
  constructor(env) {
    this.env = env;
    this.resend = null; // created lazily by ensureResendClient()
    this.fromEmail = env.FROM_EMAIL || "noreply@farmersboot.com";
    this.appName = "Farmers Boot";
    this.baseUrl = env.APP_URL || "http://localhost:3000";
  }

  // Lazily import and create Resend client at runtime when API key present
  async ensureResendClient() {
    if (this.resend) return;
    const apiKey = this.env?.RESEND_API_KEY;
    if (!apiKey || apiKey === "demo_key_for_testing") {
      this.resend = null;
      return;
    }
    try {
      const mod = await import("resend");
      const { Resend } = mod;
      this.resend = new Resend(apiKey);
    } catch (err) {
      console.error("Failed to dynamically import Resend client:", err);
      this.resend = null;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail, resetLinkOrToken) {
    try {
      let resetLink = resetLinkOrToken;
      if (!resetLinkOrToken.startsWith("http")) {
        resetLink = `${this.baseUrl}/reset-password?token=${resetLinkOrToken}`;
      }

      // Development fallback if no API key
      if (!this.env.RESEND_API_KEY) {
        console.warn("⚠️ EMAIL SETUP REQUIRED - Using Mock Implementation");
        console.warn("📧 Cannot send real emails without RESEND_API_KEY");
        console.warn("🔧 To enable email sending:");
        console.warn("   1. Get free API key from: https://resend.com");
        console.warn(
          "   2. Add to functions/.env: RESEND_API_KEY=re_your_key_here",
        );
        console.warn("   3. Restart the development server");
        console.warn("");
        console.warn("📧 [MOCK] Email would be sent to:", userEmail);
        console.warn("🔗 [MOCK] Reset link:", resetLink);

        // Return success with mock ID to allow flow to continue
        return { success: true, emailId: "mock_email_id_" + Date.now() };
      } else {
        // Lazily ensure we have a Resend client when an API key exists
        await this.ensureResendClient();
        if (!this.resend) {
          console.warn(
            "⚠️ Resend client unavailable despite API key. Falling back to mock.",
          );
          return { success: true, emailId: "mock_email_id_" + Date.now() };
        }
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

      // Check if Resend client is available
      if (!this.resend) {
        console.warn("⚠️ EMAIL SETUP REQUIRED - Using Mock Implementation");
        console.warn(
          "📧 [MOCK] Password reset email would be sent to:",
          userEmail,
        );
        console.warn("🔗 [MOCK] Reset link:", resetLink);
        return { success: true, emailId: "mock_reset_id_" + Date.now() };
      }

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [userEmail],
        subject: `Password Reset - ${this.appName}`,
        html: emailHtml,
        text: emailText,
      });

      console.log(`✅ REAL EMAIL SENT to ${userEmail}`);
      const sentId =
        result?.data?.id ??
        (typeof result?.data === "string" ? result.data : (result?.id ?? null));
      console.log(`📧 Email ID: ${sentId}`);
      console.log(`🔗 Reset link: ${resetLink}`);
      return { success: true, emailId: sentId };
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
      // Development fallback if no API key
      if (!this.env.RESEND_API_KEY) {
        console.warn("⚠️ EMAIL SETUP REQUIRED - Using Mock Implementation");
        console.warn("📧 [MOCK] Welcome email would be sent to:", userEmail);
        return { success: true, emailId: "mock_welcome_id_" + Date.now() };
      } else {
        await this.ensureResendClient();
        if (!this.resend) {
          console.warn(
            "⚠️ Resend client unavailable despite API key. Falling back to mock.",
          );
          return { success: true, emailId: "mock_welcome_id_" + Date.now() };
        }
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

      // Check if Resend client is available
      if (!this.resend) {
        console.warn("⚠️ EMAIL SETUP REQUIRED - Using Mock Implementation");
        console.warn(
          "📧 [MOCK] Password reset email would be sent to:",
          userEmail,
        );
        console.warn("🔗 [MOCK] Reset link:", resetLink);
        return { success: true, emailId: "mock_reset_id_" + Date.now() };
      }

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
   * Send account verification email
   */
  async sendVerificationEmail(userEmail, verificationToken, userName) {
    try {
      const verificationLink = `${this.baseUrl}/verify-email?token=${verificationToken}`;

      // Development fallback if no API key
      if (!this.env.RESEND_API_KEY) {
        console.warn("⚠️ EMAIL SETUP REQUIRED - Using Mock Implementation");
        console.warn(
          "📧 [MOCK] Verification email would be sent to:",
          userEmail,
        );
        console.warn("🔗 [MOCK] Verification link:", verificationLink);
        return { success: true, emailId: "mock_verification_id_" + Date.now() };
      } else {
        await this.ensureResendClient();
        if (!this.resend) {
          console.warn(
            "⚠️ Resend client unavailable despite API key. Falling back to mock.",
          );
          return {
            success: true,
            emailId: "mock_verification_id_" + Date.now(),
          };
        }
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - ${this.appName}</title>
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
                <p>Email Verification</p>
              </div>
              
              <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Hi ${userName},</p>
                <p>Thank you for signing up for ${this.appName}! To complete your registration and secure your account, please verify your email address.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationLink}" class="button">Verify Email Address</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace;">
                  ${verificationLink}
                </p>
                
                <div class="warning">
                  <strong>⚠️ Important:</strong>
                  <ul>
                    <li>This link will expire in 24 hours</li>
                    <li>If you didn't create an account with us, please ignore this email</li>
                    <li>Verifying your email helps us keep your account secure</li>
                  </ul>
                </div>
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
        ${this.appName} - Email Verification
        
        Hi ${userName},
        
        Thank you for signing up for ${this.appName}! 
        Please verify your email address to complete your registration.
        
        Click the link below to verify your email:
        ${verificationLink}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with us, please ignore this email.
        
        ---
        This email was sent by ${this.appName}
        © 2025 ${this.appName}. All rights reserved.
      `;

      // Ensure Resend client exists (dynamic import if API key present)
      await this.ensureResendClient();
      if (!this.resend) {
        console.warn("⚠️ Resend client unavailable; using mock fallback");
        return { success: true, emailId: "mock_verification_id_" + Date.now() };
      }

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [userEmail],
        subject: `Verify Your Email - ${this.appName}`,
        html: emailHtml,
        text: emailText,
      });

      console.log(`✅ Verification email sent successfully to ${userEmail}`);
      return { success: true, emailId: result.data?.id };
    } catch (error) {
      console.error("❌ Failed to send verification email:", error);
      throw new Error(`Verification email sending failed: ${error.message}`);
    }
  }

  /**
   * Send farm worker invitation email
   */
  async sendFarmInviteEmail(
    userEmail,
    inviteToken,
    farmName,
    inviterName,
    role = "worker",
  ) {
    try {
      const inviteLink = `${this.baseUrl}/accept-invite?token=${inviteToken}`;

      // Development fallback if no API key
      if (!this.env.RESEND_API_KEY) {
        console.warn("⚠️ EMAIL SETUP REQUIRED - Using Mock Implementation");
        console.warn(
          "📧 [MOCK] Farm invite email would be sent to:",
          userEmail,
        );
        console.warn("🔗 [MOCK] Invite link:", inviteLink);
        return { success: true, emailId: "mock_invite_id_" + Date.now() };
      } else {
        await this.ensureResendClient();
        if (!this.resend) {
          console.warn(
            "⚠️ Resend client unavailable despite API key. Falling back to mock.",
          );
          return { success: true, emailId: "mock_invite_id_" + Date.now() };
        }
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Farm Invitation - ${this.appName}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
              .invite-card { background: white; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .role-badge { background: #16a34a; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌱 ${this.appName}</h1>
                <p>Farm Invitation</p>
              </div>
              
              <div class="content">
                <h2>You've Been Invited to Join a Farm!</h2>
                <p>Hello,</p>
                <p><strong>${inviterName}</strong> has invited you to join <strong>${farmName}</strong> on ${this.appName} as a <span class="role-badge">${role}</span>.</p>
                
                <div class="invite-card">
                  <h3>📋 Farm Details</h3>
                  <p><strong>Farm:</strong> ${farmName}</p>
                  <p><strong>Role:</strong> ${role}</p>
                  <p><strong>Invited by:</strong> ${inviterName}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteLink}" class="button">Accept Invitation</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace;">
                  ${inviteLink}
                </p>
                
                <div class="warning">
                  <strong>⚠️ Important:</strong>
                  <ul>
                    <li>This invitation will expire in 7 days</li>
                    <li>If you don't have an account yet, you'll be able to create one when you accept</li>
                    <li>If you didn't expect this invitation, please ignore this email</li>
                  </ul>
                </div>
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
        ${this.appName} - Farm Invitation
        
        Hello,
        
        ${inviterName} has invited you to join ${farmName} on ${this.appName} as a ${role}.
        
        Click the link below to accept the invitation:
        ${inviteLink}
        
        This invitation will expire in 7 days.
        
        If you don't have an account yet, you'll be able to create one when you accept.
        
        If you didn't expect this invitation, please ignore this email.
        
        ---
        This email was sent by ${this.appName}
        © 2025 ${this.appName}. All rights reserved.
      `;

      // Check if Resend client is available
      if (!this.resend) {
        console.warn("⚠️ EMAIL SETUP REQUIRED - Using Mock Implementation");
        console.warn(
          "📧 [MOCK] Password reset email would be sent to:",
          userEmail,
        );
        console.warn("🔗 [MOCK] Reset link:", resetLink);
        return { success: true, emailId: "mock_reset_id_" + Date.now() };
      }

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [userEmail],
        subject: `Invitation to join ${farmName} - ${this.appName}`,
        html: emailHtml,
        text: emailText,
      });

      console.log(`✅ Farm invite email sent successfully to ${userEmail}`);
      return { success: true, emailId: result.data?.id };
    } catch (error) {
      console.error("❌ Failed to send farm invite email:", error);
      throw new Error(`Farm invite email sending failed: ${error.message}`);
    }
  }

  /**
   * Test email connectivity
   */
  async testEmailConnection() {
    try {
      if (!this.env.RESEND_API_KEY) {
        console.warn(
          "RESEND_API_KEY not configured - email functionality will be disabled",
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
