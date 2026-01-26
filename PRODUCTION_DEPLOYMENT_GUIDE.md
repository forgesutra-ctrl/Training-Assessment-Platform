# Production Deployment Guide

Complete guide for deploying the Training Assessment Platform to production.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Set `VITE_SUPABASE_URL` to production Supabase URL
- [ ] Set `VITE_SUPABASE_ANON_KEY` to production anon key
- [ ] Set `VITE_SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)
- [ ] Verify all environment variables are set
- [ ] Never commit `.env` files to git

### 2. Database Setup
- [ ] Run `supabase-schema.sql` in production database
- [ ] Run `supabase-constraints-validation.sql` for validation
- [ ] Run `supabase-audit-log.sql` for audit logging
- [ ] Verify all tables are created
- [ ] Verify RLS policies are enabled
- [ ] Test RLS policies with different user roles
- [ ] Set up database backups (daily recommended)
- [ ] Configure backup retention (30 days minimum)

### 3. Security
- [ ] Review and test all RLS policies
- [ ] Verify HTTPS is enforced (production only)
- [ ] Set up rate limiting (if using external service)
- [ ] Configure CORS settings in Supabase
- [ ] Review API keys and secrets
- [ ] Enable Supabase security features
- [ ] Set up email verification (if required)
- [ ] Configure password requirements

### 4. Build & Test
- [ ] Run `npm run build` successfully
- [ ] Test production build locally
- [ ] Verify all routes work
- [ ] Test authentication flows
- [ ] Test all user roles (admin, manager, trainer)
- [ ] Test error handling
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

### 5. Performance
- [ ] Enable code splitting
- [ ] Optimize images (if any)
- [ ] Enable gzip compression
- [ ] Set up CDN (if applicable)
- [ ] Test page load times
- [ ] Verify lazy loading works
- [ ] Test with large datasets

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables

4. **Configure Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

3. **Set Environment Variables:**
   - Go to Netlify Dashboard → Site Settings → Environment Variables

### Option 3: Traditional Hosting

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Upload `dist` folder** to your web server

3. **Configure web server:**
   - Point to `dist/index.html`
   - Enable SPA routing (redirect all routes to index.html)
   - Enable HTTPS
   - Set up gzip compression

### Option 4: Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf:**
   ```nginx
   server {
     listen 80;
     server_name _;
     root /usr/share/nginx/html;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }
   }
   ```

3. **Build and run:**
   ```bash
   docker build -t training-assessment .
   docker run -p 80:80 training-assessment
   ```

## 🔧 Post-Deployment Configuration

### 1. Supabase Configuration

1. **Update Site URL:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add production URL to "Site URL"
   - Add production URL to "Redirect URLs"

2. **Configure Email Templates:**
   - Go to Authentication → Email Templates
   - Customize welcome email
   - Customize password reset email

3. **Set up Email Service:**
   - Configure SMTP settings (if using custom email)
   - Or use Supabase's built-in email service

### 2. Monitoring & Analytics

1. **Error Tracking:**
   - Set up Sentry or similar service
   - Configure error reporting
   - Set up alerts

2. **Analytics:**
   - Add Google Analytics (optional)
   - Set up custom event tracking
   - Monitor user behavior

3. **Performance Monitoring:**
   - Set up performance monitoring
   - Track page load times
   - Monitor API response times

### 3. Backup Strategy

1. **Database Backups:**
   - Enable automatic backups in Supabase
   - Set retention period (30 days minimum)
   - Test backup restoration

2. **Code Backups:**
   - Use Git for version control
   - Tag production releases
   - Keep deployment history

## 🔒 Security Hardening

### 1. Environment Variables
- Never commit `.env` files
- Use secure secret management
- Rotate keys regularly
- Use different keys for dev/staging/prod

### 2. HTTPS
- Enforce HTTPS in production
- Use valid SSL certificates
- Enable HSTS headers
- Redirect HTTP to HTTPS

### 3. CORS
- Configure CORS in Supabase
- Only allow production domain
- Remove localhost in production

### 4. Rate Limiting
- Set up rate limiting (if needed)
- Configure login attempt limits
- Monitor for abuse

### 5. Session Management
- Set appropriate session timeout
- Enable secure cookies
- Configure session refresh

## 📊 Monitoring & Maintenance

### Daily
- Check error logs
- Monitor system health
- Review user activity

### Weekly
- Review audit logs
- Check backup status
- Monitor performance metrics
- Review security alerts

### Monthly
- Review user feedback
- Analyze usage statistics
- Update dependencies
- Security audit
- Performance optimization

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails:**
   - Check Node.js version (18+)
   - Clear node_modules and reinstall
   - Check for TypeScript errors

2. **Authentication Not Working:**
   - Verify Supabase URL and keys
   - Check CORS settings
   - Verify redirect URLs

3. **Database Errors:**
   - Check RLS policies
   - Verify user permissions
   - Check database connection

4. **Performance Issues:**
   - Enable code splitting
   - Optimize queries
   - Use caching
   - Check network requests

## 📝 Environment Variables Reference

```env
# Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
VITE_APP_NAME=Training Assessment Platform
VITE_APP_VERSION=1.0.0
```

## 🎯 Production Checklist

- [ ] All environment variables set
- [ ] Database schema deployed
- [ ] RLS policies tested
- [ ] HTTPS enabled
- [ ] Build successful
- [ ] All routes working
- [ ] Authentication tested
- [ ] All user roles tested
- [ ] Error handling tested
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Browser compatibility tested
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team trained on deployment

## 📞 Support

For deployment issues:
1. Check logs (browser console, server logs)
2. Review error messages
3. Check Supabase dashboard
4. Review this guide
5. Contact support if needed

---

**Your application is now production-ready!** 🎉
