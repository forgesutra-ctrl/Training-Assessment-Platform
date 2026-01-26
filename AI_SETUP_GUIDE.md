# AI Features Setup Guide

Complete guide for enabling AI-powered features in the Training Assessment Platform.

## 🤖 AI Features Overview

The platform includes several AI-powered features:

1. **AI Feedback Assistant** - Suggests feedback text for managers
2. **Performance Insights** - Analyzes trainer performance and provides insights
3. **Trend Detection** - Automatically detects performance patterns
4. **Predictive Analytics** - Forecasts future performance
5. **Smart Search** - Natural language search queries
6. **Sentiment Analysis** - Analyzes comment sentiment

## 🔑 API Provider Options

You can use either:
- **Claude API (Anthropic)** - Recommended
- **OpenAI API** - Alternative

### Claude API (Recommended)

**Why Claude:**
- Excellent for text generation
- Good understanding of context
- Competitive pricing
- Strong safety features

**Get API Key:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** section
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-`)

### OpenAI API (Alternative)

**Get API Key:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** section
4. Click **Create new secret key**
5. Copy your API key (starts with `sk-`)

## ⚙️ Configuration

### Step 1: Add Environment Variables

Add these to your `.env` file:

```env
# Enable AI features
VITE_AI_ENABLED=true

# Choose provider: 'claude' or 'openai'
VITE_AI_PROVIDER=claude

# Claude API Key (if using Claude)
VITE_CLAUDE_API_KEY=sk-ant-your-key-here

# OpenAI API Key (if using OpenAI)
VITE_OPENAI_API_KEY=sk-your-key-here
```

### Step 2: Production Environment

For production deployment, add the same variables to your hosting platform:

**Vercel:**
1. Go to Project → Settings → Environment Variables
2. Add each variable
3. Select **Production** environment
4. Redeploy

**Netlify:**
1. Go to Site Settings → Environment Variables
2. Add each variable
3. Trigger new deploy

**Custom Server:**
- Set variables before building
- Or use runtime configuration

### Step 3: Verify Setup

1. Start development server: `npm run dev`
2. Check browser console for AI status
3. Try using AI features:
   - Create assessment → Click "AI Assistant" button
   - View trainer dashboard → Check "AI Insights" section

## 🎛️ Admin Settings

### Enable/Disable AI Features

AI features can be toggled in admin settings (to be implemented):

1. Go to **Settings** → **AI Configuration**
2. Toggle **Enable AI Features**
3. Select **AI Provider**
4. Enter **API Key**
5. Save settings

### Feature-Specific Controls

- ✅ **AI Feedback Assistant** - Enable/disable per manager
- ✅ **Performance Insights** - Enable/disable per trainer
- ✅ **Predictive Analytics** - Admin only
- ✅ **Smart Search** - Admin only
- ✅ **Sentiment Analysis** - Automatic (always on)

## 💰 Pricing & Costs

### Claude API Pricing

- **Claude 3 Sonnet:** ~$3 per 1M input tokens, $15 per 1M output tokens
- **Typical cost per suggestion:** ~$0.001-0.005
- **Monthly estimate (1000 suggestions):** ~$1-5

### OpenAI API Pricing

- **GPT-4 Turbo:** ~$10 per 1M input tokens, $30 per 1M output tokens
- **Typical cost per suggestion:** ~$0.002-0.01
- **Monthly estimate (1000 suggestions):** ~$2-10

### Cost Optimization Tips

1. **Cache suggestions** - Don't regenerate for same rating/parameter
2. **Use smaller models** - Claude Haiku or GPT-3.5 for simple tasks
3. **Batch requests** - Group multiple requests when possible
4. **Set usage limits** - Monitor API usage
5. **Fallback to templates** - Use templates when AI is unavailable

## 🔒 Security Best Practices

### API Key Security

✅ **DO:**
- Store keys in environment variables
- Use different keys for dev/staging/prod
- Rotate keys regularly
- Monitor API usage
- Set usage limits

❌ **DON'T:**
- Commit API keys to Git
- Share keys publicly
- Use production keys in development
- Expose keys in client-side code

### Data Privacy

- AI providers may log requests (check their privacy policy)
- Consider on-premise solutions for sensitive data
- Review data retention policies
- Ensure compliance with data regulations

## 🧪 Testing AI Features

### Test AI Feedback Assistant

1. Go to **Manager Dashboard** → **New Assessment**
2. Select a trainer
3. Rate a parameter (1-5 stars)
4. Click **"AI Assistant"** button next to comments
5. Verify suggestions appear
6. Test different tones (Professional, Encouraging, Direct)
7. Select a suggestion and verify it fills the textarea

### Test Performance Insights

1. Go to **Trainer Dashboard**
2. Scroll to **"AI Performance Insights"** section
3. Verify insights are displayed
4. Check that insights are relevant to performance data

### Test Smart Search

1. Go to **Admin Dashboard**
2. Use the search bar
3. Try queries like:
   - "Show trainers who improved"
   - "Find managers with low activity"
   - "Compare Q1 vs Q2"
4. Verify results appear

## 🐛 Troubleshooting

### AI Features Not Working

**Problem:** AI Assistant button doesn't appear or doesn't work

**Solutions:**
- Check `VITE_AI_ENABLED=true` in `.env`
- Verify API key is correct
- Check browser console for errors
- Verify API key has credits/quota
- Check network connection

### API Errors

**Problem:** "API error" or "Failed to generate"

**Solutions:**
- Verify API key is valid
- Check API quota/limits
- Verify provider is accessible
- Check error logs in browser console
- Try fallback suggestions (should work without API)

### Slow Response Times

**Problem:** AI suggestions take too long

**Solutions:**
- Check API provider status
- Verify network connection
- Consider using faster models
- Implement caching
- Show loading states clearly

### High Costs

**Problem:** API costs are too high

**Solutions:**
- Review usage patterns
- Implement caching
- Use smaller/cheaper models
- Set usage limits
- Consider disabling for non-essential features

## 📊 Monitoring Usage

### Track API Calls

Monitor API usage through:
- Provider dashboard (Anthropic/OpenAI)
- Application logs
- Custom analytics
- Usage alerts

### Set Alerts

Configure alerts for:
- High usage spikes
- Cost thresholds
- API errors
- Quota limits

## 🔄 Fallback Behavior

When AI is unavailable, the system:
- ✅ Shows fallback suggestions (template-based)
- ✅ Continues to function normally
- ✅ Displays clear messages to users
- ✅ Logs errors for debugging

Users will see:
- "AI features disabled" message
- Basic insights instead of AI-generated
- Template suggestions instead of AI suggestions

## 📝 Example Queries

### For AI Feedback Assistant

**Rating 5:**
- "Excellent performance in [parameter]"
- "Outstanding [parameter] skills"
- "Strong [parameter] abilities"

**Rating 3-4:**
- "Good [parameter] performance"
- "Competent in [parameter]"
- "Adequate [parameter] skills"

**Rating 1-2:**
- "[Parameter] needs improvement"
- "Development opportunity in [parameter]"
- "Requires attention in [parameter]"

### For Smart Search

- "Show trainers who improved this quarter"
- "Which managers are most active?"
- "Find trainers with low technical skills"
- "Compare Q1 vs Q2 performance"
- "Show declining trends"
- "Find skill gaps"

## 🎯 Best Practices

1. **Start Small:** Enable one feature at a time
2. **Monitor Costs:** Track usage and costs
3. **Test Thoroughly:** Test all AI features before production
4. **User Education:** Inform users about AI features
5. **Fallback Plans:** Always have non-AI alternatives
6. **Regular Review:** Review AI suggestions for quality
7. **Update Models:** Keep up with new model releases

## 📞 Support

For AI-related issues:
1. Check this guide
2. Review provider documentation
3. Check API status pages
4. Contact provider support
5. Review application logs

---

**AI features are optional and can be enabled/disabled at any time!** 🤖

For deployment questions, see `DEPLOYMENT.md`.
For user guides, see `USER_GUIDE.md`.
