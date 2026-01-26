# Training Assessment Platform

A modern, production-ready training assessment system built with React, TypeScript, Vite, and Supabase. This platform enables managers to assess trainers from other teams, trainers to view their performance metrics, and administrators to manage the entire system.

## 🎯 Features

### For Managers
- ✅ Create assessments for trainers from other teams
- ✅ Rate trainers on 6 key parameters
- ✅ View assessment history and statistics
- ✅ Dashboard with quick stats and recent assessments

### For Trainers
- ✅ View performance metrics and trends
- ✅ See detailed feedback from assessments
- ✅ Track progress over time
- ✅ Identify strengths and areas for improvement

### For Administrators
- ✅ Comprehensive analytics and reporting
- ✅ User management (create, edit, bulk upload)
- ✅ Trainer performance tracking
- ✅ Manager activity monitoring
- ✅ Time-based analysis
- ✅ Audit log system
- ✅ Organizational structure visualization

## 🛠️ Tech Stack

- **Frontend:**
  - React 18.2+ (UI framework)
  - TypeScript (type safety)
  - Vite 7.3+ (build tool)
  - Tailwind CSS (styling)
  - React Router (routing)
  - Recharts (data visualization)
  - Lucide React (icons)
  - React Hot Toast (notifications)

- **Backend:**
  - Supabase (database, authentication, real-time)
  - PostgreSQL (database)
  - Row Level Security (RLS) for data protection

- **Development:**
  - ESLint (code quality)
  - TypeScript (type checking)
  - Vite (fast development)

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js** version 18 or higher - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** package manager
- **Git** (for version control)
- **Supabase account** - [Sign up here](https://supabase.com) (free tier available)

## 🚀 Quick Start

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd training-assessment-platform
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages. This may take a few minutes.

### Step 3: Set Up Environment Variables

1. Copy the `.env.example` file:
   ```bash
   # Windows
   copy .env.example .env
   
   # Mac/Linux
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project (or use existing)
   - Go to **Settings** → **API**
   - Copy your **Project URL** and **anon public** key

3. Update `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 4: Set Up Database

1. Go to Supabase Dashboard → **SQL Editor**
2. Run these scripts in order:
   - `supabase-schema.sql` (creates tables)
   - `supabase-constraints-validation.sql` (adds validation)
   - `supabase-audit-log.sql` (adds audit logging)

3. Verify tables are created:
   - Go to **Table Editor**
   - You should see: `profiles`, `teams`, `assessments`, `audit_logs`

### Step 5: Start Development Server

```bash
npm run dev
```

You should see:
```
  VITE v7.3.1  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Step 6: Create First User

1. Go to `/signup` (or create user in Supabase dashboard)
2. Create an admin user:
   - Email: `admin@example.com`
   - Password: (strong password)
   - Role: Admin
3. Log in and start using the platform!

## 📁 Project Structure

```
training-assessment-platform/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   ├── ProtectedRoute.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ...
│   ├── pages/              # Main application pages
│   │   ├── Login.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── TrainerDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── Settings.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── useDebounce.ts
│   ├── lib/                # Third-party configs
│   │   └── supabase.ts
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   ├── utils/              # Helper functions
│   │   ├── assessments.ts
│   │   ├── userManagement.ts
│   │   ├── auditLog.ts
│   │   └── ...
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
├── .env.example            # Environment variables template
└── README.md               # This file
```

## 🎨 Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting errors
npm run type-check   # TypeScript type checking
```

### Production

```bash
npm run build:prod   # Production build with optimizations
npm run preview:prod # Preview production build
```

### Database

```bash
npm run seed         # Seed database with test data
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) | No |

See `.env.example` for template.

### Build Configuration

The production build is optimized with:
- ✅ Code minification (Terser)
- ✅ Console.log removal
- ✅ Code splitting
- ✅ Asset optimization
- ✅ Source maps (hidden)
- ✅ Tree shaking

See `vite.config.ts` for details.

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[USER_GUIDE.md](./USER_GUIDE.md)** - User documentation for all roles
- **[PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)** - Production setup
- **[QA_CHECKLIST.md](./QA_CHECKLIST.md)** - Testing checklist
- **[EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md)** - Email notification templates
- **[PRODUCTION_READY_SUMMARY.md](./PRODUCTION_READY_SUMMARY.md)** - Feature summary

## 🚀 Deployment

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Other Platforms

- **Netlify:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Custom Server:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Docker:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔒 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ Secure password requirements
- ✅ Session management
- ✅ Audit logging
- ✅ Role-based access control

## 🎯 Key Features

### Assessment System
- Cross-team assessment enforcement
- 6-parameter rating system
- Comment validation (20-500 chars)
- Duplicate prevention
- Real-time validation

### Analytics & Reporting
- Trainer performance metrics
- Manager activity tracking
- Time-based analysis
- Export capabilities (CSV, Excel)
- Visual charts and graphs

### User Management
- Create, edit, deactivate users
- Bulk user upload (CSV)
- Organizational structure visualization
- Role-based permissions

### Audit & Compliance
- Complete audit log system
- 1-year retention policy
- Export audit logs
- Track all system activities

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
- Vite will automatically use the next available port
- Check terminal output for the actual port

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Supabase connection issues:**
- Verify `.env` file exists and has correct values
- Check Supabase project is active
- Verify URL and key are correct

**Build fails:**
- Check Node.js version: `node --version` (need 18+)
- Run type check: `npm run type-check`
- Check for linting errors: `npm run lint`

### Getting Help

1. Check [USER_GUIDE.md](./USER_GUIDE.md) for user issues
2. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
3. Check browser console (F12) for errors
4. Review Supabase dashboard for database issues

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Follow existing code structure

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Supabase](https://supabase.com/) - Backend platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Recharts](https://recharts.org/) - Charts
- [Lucide](https://lucide.dev/) - Icons

## 📞 Support

For support:
- **User Issues:** See [USER_GUIDE.md](./USER_GUIDE.md)
- **Deployment:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Technical:** Check documentation files
- **Email:** support@trainingassessment.com

## 🎉 Getting Started Checklist

- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set (`.env` file)
- [ ] Supabase project created
- [ ] Database scripts run
- [ ] Development server running (`npm run dev`)
- [ ] First admin user created
- [ ] Test data seeded (optional)
- [ ] Ready to use!

---

**Built with ❤️ for effective training assessment management**

For detailed guides, see the documentation files in this repository.
