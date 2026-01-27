# Google AI Setup Guide for Farm Management App

## Overview
This guide walks you through setting up Google AI models (Gemini 2.0 Flash) for intelligent farm insights and recommendations.

## Prerequisites
- Google account
- Active farm management app project
- Basic knowledge of environment variables

## Step 1: Get Google AI Studio API Key

1. **Visit Google AI Studio**
   - Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key**
   - Click **"Create API Key"**
   - Choose **"Create new API key"**
   - Copy the generated key (starts with `AIza...`)

3. **Note Your Quotas**
   - Free tier: 1,000,000 tokens/minute, 1,500 requests/day
   - Monitor usage in Google AI Studio dashboard

## Step 2: Configure Environment Variables

### For Local Development
1. Copy `.env.local` to `.env`:
   ```bash
   cp .env.local .env
   ```

2. Edit `.env` and replace:
   ```env
   GOOGLE_AI_API_KEY=AIza...your-actual-key-here
   GOOGLE_AI_MODEL=gemini-2.0-flash-exp
   ```

### For Production (Cloudflare Workers)
1. Go to your Cloudflare Workers dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - `GOOGLE_AI_API_KEY`: Your API key
   - `GOOGLE_AI_MODEL`: `gemini-2.0-flash-exp`

## Step 3: Test the Integration

### Backend Testing
```bash
# Start your backend
npm run dev

# Test the AI endpoint
curl -X POST http://localhost:8787/api/ai/insights \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are the best practices for tomato farming?"}'
```

### Frontend Testing
1. Navigate to any page with the AI Insights Panel
2. Ask a question like "What should I prioritize this week?"
3. Verify you get a helpful AI response

## Available AI Features

### 1. General Farm Insights
- **Endpoint**: `/api/ai/insights`
- **Usage**: Ask any farm-related question
- **Example**: "How do I prevent common corn diseases?"

### 2. Crop Analysis
- **Endpoint**: `/api/ai/crop-analysis`
- **Usage**: Analyze specific crop data
- **Example**: Provide crop type, growth stage, health status

### 3. Livestock Advice
- **Endpoint**: `/api/ai/livestock-advice`
- **Usage**: Get livestock management recommendations
- **Example**: Feed schedules, health monitoring, breeding

### 4. Task Scheduling
- **Endpoint**: `/api/ai/task-scheduling`
- **Usage**: Optimize farm task schedules
- **Example**: Prioritize tasks based on weather and resources

## Security Considerations

### API Key Protection
- ✅ Never commit API keys to git
- ✅ Use environment variables
- ✅ Rotate keys periodically
- ✅ Monitor usage for anomalies

### Rate Limiting
- Free tier: 1,500 requests/day
- Implement client-side rate limiting
- Cache responses when appropriate
- Handle quota exceeded gracefully

## Troubleshooting

### Common Issues

#### 1. "API Key Invalid" Error
- Verify key is correctly copied
- Check environment variable spelling
- Ensure no extra spaces or characters

#### 2. "Quota Exceeded" Error
- Monitor usage in Google AI Studio
- Implement request throttling
- Consider upgrading to paid tier

#### 3. "CORS" Error
- Ensure backend CORS is configured
- Check frontend API URL configuration
- Verify authentication headers

#### 4. Slow Responses
- Gemini 2.0 Flash is optimized for speed
- Check network connectivity
- Consider response caching

### Debug Mode
Enable debug logging by setting:
```env
ENVIRONMENT=development
ENABLE_AUDIT_LOGGING=true
```

## Advanced Configuration

### Custom Prompts
Modify the system prompt in `backend/api/ai/google-ai.js` to customize AI behavior for your specific farm type.

### Model Selection
Available models:
- `gemini-2.0-flash-exp` (recommended)
- `gemini-1.5-flash`
- `gemini-1.5-pro`

### Response Caching
Implement caching to reduce API calls and improve response times.

## Monitoring and Analytics

### Usage Tracking
Monitor API usage through:
- Google AI Studio dashboard
- Cloudflare Workers analytics
- Custom logging in your application

### Cost Management
- Track token usage
- Set up alerts for quota limits
- Optimize prompts for efficiency

## Next Steps

1. **Integrate with Real Data**: Connect AI insights with your actual farm data
2. **Custom Prompts**: Tailor AI responses to your specific farming practices
3. **Automated Alerts**: Set up AI-powered notifications for farm issues
4. **Historical Analysis**: Use AI to analyze trends and patterns over time

## Support

- **Google AI Documentation**: [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **Gemini API Reference**: [https://ai.google.dev/tutorials/rest_quickstart](https://ai.google.dev/tutorials/rest_quickstart)
- **Farm Management App Issues**: Create an issue in your project repository

## License and Terms

- Google AI API usage is subject to Google's Terms of Service
- Ensure compliance with data privacy regulations
- Review AI usage policies for agricultural applications
