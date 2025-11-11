# Email Service Setup Guide

## Overview

The Farmers Boot application now supports real email sending for password resets and other notifications using Resend (a modern email API service).

## Current Behavior

The system **requires a real API key for email functionality** in both development and production:

- Without API key: Shows clear error message and setup instructions
- With API key: Sends actual emails to real inboxes
- No mock/development fallback - ensures testing matches production behavior

## Quick Setup (5 minutes)

### 1. Get Free Resend API Key

1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month)
2. Go to API Keys section in dashboard
3. Create new API key
4. Copy the key (starts with `re_`)

### 2. Configure Environment

Add to your `functions/.env` file:

```bash
RESEND_API_KEY=re_your_actual_api_key_here
FROM_EMAIL=noreply@farmersboot.com
APP_URL=http://localhost:3000
```

### 3. Test Email Functionality

1. Restart the development server
2. Go to Forgot Password page
3. Enter your email address
4. Check your inbox for the password reset email
5. Verify the reset link works

## Email Features

### Password Reset Emails

- Professional HTML email templates with Farmers Boot branding
- Responsive design for mobile and desktop
- Security warnings and 1-hour expiration
- Both HTML and text versions for better deliverability

### Welcome Emails (Future)

- New user registration confirmations
- Getting started guides
- Account activation links

## Development Testing

### What You'll See

With proper API key configured:

- **Server Console**: `✅ REAL EMAIL SENT to user@example.com`
- **Frontend**: "Password reset link has been sent to your email"
- **Your Inbox**: Professional HTML email with reset link

### What You'll See Without API Key

- **Server Console**: Clear setup instructions with step-by-step guide
- **Frontend**: "Email delivery failed" error message
- **No Emails**: System prevents sending without valid configuration

## Production Deployment

### Environment Variables

```bash
# Production settings
RESEND_API_KEY=re_your_production_api_key
FROM_EMAIL=noreply@yourdomain.com
APP_URL=https://yourdomain.com
```

### Domain Setup (Recommended)

1. In Resend dashboard, add your production domain
2. Configure DNS records as instructed (SPF, DKIM)
3. Update `FROM_EMAIL` to use verified domain
4. This improves deliverability and prevents spam classification

## Troubleshooting

### Email Not Sending

- Check API key is correct and active
- Verify `FROM_EMAIL` domain matches your verified domain
- Check server console for specific error messages
- Ensure Resend account has sufficient credits

### Emails Going to Spam

- Use verified domain for `FROM_EMAIL`
- Include proper SPF/DKIM DNS records
- Test with different email providers (Gmail, Outlook, etc.)
- Check Resend reputation dashboard for issues

### Reset Links Not Working

- Verify `APP_URL` matches your actual domain
- Check token expiration (1 hour default)
- Ensure frontend route `/reset-password` exists
- Test link in incognito/private browser mode

## Security Features

- All reset tokens are cryptographically hashed before storage
- Tokens expire after exactly 1 hour
- Email sending is rate-limited to prevent abuse
- No sensitive data included in email content
- All links use HTTPS in production

## Cost Information

- **Free Tier**: 3,000 emails/month (perfect for development/testing)
- **Paid Plans**: Starting at $20/month for 50,000 emails
- **No Setup Fees**: Pay only for emails you send
- **Password Reset Cost**: ~$0.40 per 1,000 emails

## Quick Test Commands

### Test Email Service Status

```bash
# Check if API key is configured
curl -H "Authorization: Bearer $RESEND_API_KEY" \
     https://api.resend.com/domains
```

### Send Test Email

1. Use the Forgot Password feature in the app
2. Check your email inbox
3. Verify the email appears with proper formatting
4. Test the reset link functionality

## Support Resources

- **Resend Documentation**: [resend.com/docs](https://resend.com/docs)
- **DNS Setup Guide**: [resend.com/docs/learn/how-to-use-a-custom-domain](https://resend.com/docs/learn/how-to-use-a-custom-domain)
- **Email Deliverability**: [resend.com/docs/learn/deliverability](https://resend.com/docs/learn/deliverability)

## Migration from Mock System

If you were using the previous mock email system:

1. The old "check console for link" behavior is removed
2. All email functionality now requires real API configuration
3. This ensures development testing matches production behavior
4. No more surprises when deploying to production
