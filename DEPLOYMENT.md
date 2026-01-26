# Deployment Guide

Complete step-by-step guide for deploying the Training Assessment Platform to production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deploying to Vercel](#deploying-to-vercel-recommended)
4. [Deploying to Netlify](#deploying-to-netlify)
5. [Deploying to Custom Server](#deploying-to-custom-server)
6. [Environment Variables Setup](#environment-variables-setup)
7. [Database Setup](#database-setup)
8. [Post-Deployment Tasks](#post-deployment-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, make sure you have:

- ✅ A Supabase account and project set up
- ✅ All database tables created (run the SQL scripts)
- ✅ Node.js 18+ installed (for local testing)
- ✅ Git repository set up (recommended)
- ✅ Domain name ready (optional, for custom domain)

---

## Pre-Deployment Checklist

Complete these steps before deploying:

- [ ] **Database Setup:**
  - [ ] Run `supabase-schema.sql` in Supabase SQL Editor
  - [ ] Run `supabase-constraints-validation.sql`
  - [ ] Run `supabase-audit-log.sql`
  - [ ] Verify all tables are created
  - [ ] Test RLS policies

- [ ] **Local Testing:**
  - [ ] Run `npm run build` successfully
  - [ ] Test production build locally: `npm run preview`
  - [ ] Verify all features work
  - [ ] Check for console errors

- [ ] **Environment Variables:**
  - [ ] Prepare production Supabase URL
  - [ ] Prepare production Supabase anon key
  - [ ] Prepare service role key (if needed)

- [ ] **Code Review:**
  - [ ] Remove any test/development code
  - [ ] Verify no sensitive data in code
  - [ ] Check all routes work
  - [ ] Test authentication flows

---

## Deploying to Vercel (Recommended)

Vercel is the easiest and fastest way to deploy. It's free for personal projects and has excellent performance.

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub, GitLab, or email
3. Verify your email address

### Step 2: Install Vercel CLI (Optional)

You can deploy via the website, but CLI is faster:

```bash
npm install -g vercel
```

### Step 3: Deploy from Command Line

1. **Navigate to your project folder:**
   ```bash
   cd path/to/your/project
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? **No** (first time)
   - Project name: **training-assessment-platform** (or your choice)
   - Directory: **./** (current directory)
   - Override settings? **No**

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Step 4: Deploy via Website (Alternative)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository (GitHub/GitLab/Bitbucket)
3. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Click **Deploy**

### Step 5: Configure Environment Variables

1. Go to your project dashboard on Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** Your production Supabase URL
   - **Environment:** Production (and Preview if needed)
   - Click **Save**
   
   Repeat for:
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_SERVICE_ROLE_KEY` (if needed)

4. **Redeploy** after adding variables:
   - Go to **Deployments** tab
   - Click the **⋯** menu on latest deployment
   - Click **Redeploy**

### Step 6: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain name
3. Follow DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

### Step 7: Verify Deployment

1. Visit your deployment URL (e.g., `your-project.vercel.app`)
2. Test login functionality
3. Verify all pages load correctly
4. Check browser console for errors

**✅ You're live on Vercel!**

---

## Deploying to Netlify

Netlify is another excellent option with similar features to Vercel.

### Step 1: Create Netlify Account

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub, GitLab, or email
3. Verify your email

### Step 2: Deploy via Website

1. Go to [app.netlify.com/add-site](https://app.netlify.com/add-site)
2. Choose **Import from Git** (recommended) or **Deploy manually**
3. If using Git:
   - Connect your repository
   - Configure build:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Click **Deploy site**

### Step 3: Configure Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Add variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_SERVICE_ROLE_KEY` (if needed)
3. Click **Save**
4. **Trigger new deploy** from **Deploys** tab

### Step 4: Custom Domain

1. Go to **Domain settings**
2. Add custom domain
3. Configure DNS as instructed
4. Wait for SSL certificate (automatic)

**✅ You're live on Netlify!**

---

## Deploying to Custom Server

For advanced users who want to deploy to their own server (VPS, AWS, etc.).

### Step 1: Build the Application

On your local machine:

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist` folder with all production files.

### Step 2: Upload Files

Upload the entire `dist` folder to your web server using:
- **FTP/SFTP** (FileZilla, WinSCP)
- **SCP** command:
  ```bash
  scp -r dist/* user@your-server.com:/var/www/html/
  ```
- **rsync**:
  ```bash
  rsync -avz dist/ user@your-server.com:/var/www/html/
  ```

### Step 3: Configure Web Server

#### For Nginx:

Create `/etc/nginx/sites-available/training-assessment`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing - redirect all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/training-assessment /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### For Apache:

Create `.htaccess` in your `dist` folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Step 4: Set Environment Variables

Since you can't use `.env` files in static hosting, you have two options:

**Option A: Build-time variables (Recommended)**
- Set variables before building
- They're baked into the build

**Option B: Runtime configuration**
- Create a `config.js` file that's loaded at runtime
- Update it on the server when needed

### Step 5: SSL Certificate

Use Let's Encrypt (free):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**✅ You're live on your custom server!**

---

## Environment Variables Setup

### Required Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Supabase Dashboard → Settings → API |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `VITE_APP_NAME` | Application name |
| `VITE_APP_VERSION` | Application version |

### How to Add in Hosting Platforms

#### Vercel:
1. Project → Settings → Environment Variables
2. Add variable name and value
3. Select environment (Production/Preview/Development)
4. Save and redeploy

#### Netlify:
1. Site settings → Environment variables
2. Add variable
3. Save and trigger new deploy

#### Custom Server:
- Set in build process before `npm run build`
- Or use runtime configuration file

### Security Best Practices

✅ **DO:**
- Use different keys for dev/staging/prod
- Store keys securely (never in code)
- Rotate keys regularly
- Use environment variables in hosting platform
- Restrict service role key access

❌ **DON'T:**
- Commit `.env` files to Git
- Share keys publicly
- Use production keys in development
- Expose service role key in client code

---

## Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for project to initialize (2-3 minutes)

### Step 2: Run Database Scripts

1. Go to **SQL Editor** in Supabase dashboard
2. Run scripts in this order:
   - `supabase-schema.sql` (creates tables)
   - `supabase-constraints-validation.sql` (adds validation)
   - `supabase-audit-log.sql` (adds audit logging)

### Step 3: Verify Tables

1. Go to **Table Editor**
2. Verify these tables exist:
   - `profiles`
   - `teams`
   - `assessments`
   - `audit_logs`

### Step 4: Enable RLS

1. Go to **Authentication** → **Policies**
2. Verify RLS is enabled on all tables
3. Test policies with different user roles

### Step 5: Create Indexes

Indexes are created in the schema scripts, but verify:
- `idx_assessments_trainer_date`
- `idx_assessments_assessor_date`
- `idx_audit_logs_created_at`

### Step 6: Backup Strategy

1. Go to **Settings** → **Database**
2. Enable **Point-in-time Recovery** (recommended)
3. Set up **Scheduled Backups** (daily recommended)
4. Test backup restoration

### Step 7: Performance

1. Monitor query performance
2. Add indexes for slow queries
3. Enable connection pooling (if needed)

---

## Post-Deployment Tasks

### 1. Create Admin User

1. Visit your deployed site
2. Go to `/signup` (if enabled) or use Supabase dashboard
3. Create first admin user:
   - Email: `admin@yourcompany.com`
   - Password: (strong password)
   - Role: Admin
4. Log in and verify admin access

### 2. Set Up Email Service

Choose one:

**Option A: Supabase Built-in Email**
- Already configured
- Limited customization
- Good for testing

**Option B: Custom SMTP**
1. Go to Supabase → Settings → Auth
2. Configure SMTP settings
3. Test email delivery

**Option C: External Service (SendGrid, AWS SES)**
- Follow `EMAIL_TEMPLATES.md` guide
- Set up API keys
- Configure templates

### 3. Configure Custom Domain

1. Add domain in hosting platform
2. Update DNS records:
   - **A Record:** Point to hosting IP
   - **CNAME:** Point to hosting URL
3. Wait for SSL certificate (automatic on Vercel/Netlify)
4. Verify HTTPS works

### 4. Monitor Error Logs

**Vercel:**
- Go to **Deployments** → Click deployment → **Functions** tab
- Check for errors

**Netlify:**
- Go to **Functions** → View logs
- Set up error notifications

**Custom Server:**
- Check web server error logs
- Set up monitoring (Sentry, LogRocket)

### 5. Set Up Analytics (Optional)

1. Add Google Analytics or similar
2. Track user behavior
3. Monitor performance metrics

### 6. Test Everything

Use the `QA_CHECKLIST.md` to verify:
- [ ] Login works
- [ ] All dashboards load
- [ ] Assessments can be created
- [ ] Data displays correctly
- [ ] No console errors

---

## Troubleshooting

### Build Fails

**Problem:** `npm run build` fails

**Solutions:**
- Check Node.js version (need 18+): `node --version`
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check for TypeScript errors: `npm run type-check`
- Check for linting errors: `npm run lint`

### Environment Variables Not Working

**Problem:** Variables not loading in production

**Solutions:**
- Verify variable names start with `VITE_`
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables
- Check browser console for errors

### Database Connection Issues

**Problem:** Can't connect to Supabase

**Solutions:**
- Verify Supabase URL is correct
- Check anon key is correct
- Verify project is active (not paused)
- Check CORS settings in Supabase
- Verify RLS policies allow access

### Routes Not Working (404 Errors)

**Problem:** Direct URL access shows 404

**Solutions:**
- **Vercel/Netlify:** Should work automatically
- **Custom Server:** Configure redirect to `index.html` (see server config above)
- Check `vite.config.ts` base path

### Slow Performance

**Problem:** Site loads slowly

**Solutions:**
- Enable gzip compression
- Use CDN (Vercel/Netlify have this)
- Optimize images
- Check database query performance
- Enable caching headers

### Authentication Not Working

**Problem:** Can't log in

**Solutions:**
- Check Supabase URL and keys
- Verify redirect URLs in Supabase settings
- Check browser console for errors
- Verify user exists in Supabase
- Check email verification settings

### Still Having Issues?

1. Check browser console for errors (F12)
2. Check hosting platform logs
3. Review Supabase dashboard for errors
4. Test locally first: `npm run preview`
5. Check `PRODUCTION_DEPLOYMENT_GUIDE.md` for more details

---

## Quick Reference

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Deployment URLs

After deployment, you'll get a URL like:
- **Vercel:** `your-project.vercel.app`
- **Netlify:** `your-project.netlify.app`
- **Custom:** `your-domain.com`

### Important Links

- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Netlify Dashboard:** https://app.netlify.com

---

**🎉 Congratulations! Your application is now live!**

For user documentation, see `USER_GUIDE.md`.
For technical details, see `README.md`.
