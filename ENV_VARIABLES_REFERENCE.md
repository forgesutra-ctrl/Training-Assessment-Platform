# Environment Variables Reference

Complete reference for all environment variables used in the Training Assessment Platform.

## 📋 Required Variables

### Supabase Configuration

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to get:**
- Go to Supabase Dashboard → Settings → API
- Copy "Project URL" and "anon public" key

**Required:** Yes (for all features)

---

## 🔧 Optional Variables

### Service Role Key

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to get:**
- Supabase Dashboard → Settings → API
- Copy "service_role" key

**Required:** No (only for server-side operations like seed scripts)

**⚠️ Security:** Never expose in client-side code!

---

## 🤖 AI Features Configuration

### Enable AI Features

```env
VITE_AI_ENABLED=true
```

**Options:**
- `true` - Enable AI features
- `false` - Disable AI features (default)

**Required:** No (platform works without AI)

---

### AI Provider Selection

```env
VITE_AI_PROVIDER=claude
```

**Options:**
- `claude` - Use Claude API (Anthropic) - Recommended
- `openai` - Use OpenAI API

**Required:** Only if `VITE_AI_ENABLED=true`

---

### Claude API Key

```env
VITE_CLAUDE_API_KEY=sk-ant-your-key-here
```

**Where to get:**
- Go to [console.anthropic.com](https://console.anthropic.com)
- Sign up/login
- Go to API Keys
- Create new key

**Required:** Only if `VITE_AI_PROVIDER=claude`

---

### OpenAI API Key

```env
VITE_OPENAI_API_KEY=sk-your-key-here
```

**Where to get:**
- Go to [platform.openai.com](https://platform.openai.com)
- Sign up/login
- Go to API Keys
- Create new secret key

**Required:** Only if `VITE_AI_PROVIDER=openai`

---

## 📝 Complete .env Example

```env
# ============================================
# Supabase Configuration (REQUIRED)
# ============================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service Role Key (for server-side operations)
# VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================
# AI Features Configuration (OPTIONAL)
# ============================================
# Enable AI-powered features
VITE_AI_ENABLED=false

# AI Provider: 'claude' or 'openai'
VITE_AI_PROVIDER=claude

# Claude API Key (if using Claude)
# Get from: https://console.anthropic.com
# VITE_CLAUDE_API_KEY=sk-ant-your-key-here

# OpenAI API Key (if using OpenAI)
# Get from: https://platform.openai.com
# VITE_OPENAI_API_KEY=sk-your-key-here
```

---

## 🔒 Security Best Practices

### ✅ DO:

- Store all keys in `.env` file
- Add `.env` to `.gitignore`
- Use different keys for dev/staging/prod
- Rotate keys regularly
- Use environment variables in hosting platforms
- Monitor API usage

### ❌ DON'T:

- Commit `.env` files to Git
- Share keys publicly
- Use production keys in development
- Expose service role key in client code
- Hardcode keys in source files

---

## 🌍 Environment-Specific Setup

### Development

```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key
VITE_AI_ENABLED=true
VITE_AI_PROVIDER=claude
VITE_CLAUDE_API_KEY=dev-claude-key
```

### Production

```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
VITE_AI_ENABLED=true
VITE_AI_PROVIDER=claude
VITE_CLAUDE_API_KEY=prod-claude-key
```

**Note:** Use different projects and keys for each environment!

---

## 🚀 Hosting Platform Setup

### Vercel

1. Go to Project → Settings → Environment Variables
2. Add each variable
3. Select environment (Production/Preview/Development)
4. Save
5. Redeploy

### Netlify

1. Go to Site Settings → Environment Variables
2. Add each variable
3. Save
4. Trigger new deploy

### Custom Server

**Option 1: Build-time**
- Set variables before `npm run build`
- Variables are baked into build

**Option 2: Runtime**
- Use configuration file
- Load at runtime
- Update without rebuilding

---

## ✅ Verification Checklist

After setting up environment variables:

- [ ] `.env` file exists in project root
- [ ] All required variables are set
- [ ] Supabase URL and key are correct
- [ ] AI variables set (if using AI features)
- [ ] `.env` is in `.gitignore`
- [ ] Variables work in development (`npm run dev`)
- [ ] Variables work in production build (`npm run build`)
- [ ] Hosting platform has variables configured

---

## 🐛 Troubleshooting

### Variables Not Loading

**Problem:** Variables not accessible in code

**Solutions:**
- Ensure variable names start with `VITE_`
- Restart development server after adding variables
- Check for typos in variable names
- Verify `.env` file is in project root
- Clear browser cache

### API Errors

**Problem:** API calls failing

**Solutions:**
- Verify API keys are correct
- Check API key has credits/quota
- Verify provider is accessible
- Check network connection
- Review error messages in console

### Build Errors

**Problem:** Build fails with missing variables

**Solutions:**
- Set all required variables
- Use `.env.production` for production builds
- Check variable names match exactly
- Verify no syntax errors in `.env` file

---

## 📞 Need Help?

1. Check this reference guide
2. Review `AI_SETUP_GUIDE.md` for AI setup
3. Review `DEPLOYMENT.md` for deployment setup
4. Check browser console for errors
5. Verify Supabase dashboard for database issues

---

**Keep your keys secure and never commit them to version control!** 🔒
