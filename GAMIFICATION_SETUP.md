# Gamification Setup Instructions

Quick setup guide for enabling gamification features.

## 🚀 Quick Setup

### 1. Database Setup

Run the SQL script in Supabase SQL Editor:

```sql
-- Run: supabase-gamification.sql
```

This creates all necessary tables, triggers, and functions.

### 2. Environment Variable

Add to your `.env` file:

```env
VITE_GAMIFICATION_ENABLED=true
```

### 3. Verify

1. Log in as a trainer
2. Go to Trainer Dashboard
3. You should see tabs: Overview, Badges, Goals, Level, Streaks, Leaderboard
4. Receive an assessment to trigger XP and badges

## ✅ Features Enabled

- ✅ Achievement Badges System
- ✅ Progress Tracking & Goals
- ✅ Leaderboards (opt-in)
- ✅ Trainer Level System (XP)
- ✅ Engagement Streaks
- ⏳ Interactive Dashboard Widgets (coming soon)
- ⏳ Social Features (coming soon)

## 📚 Documentation

- **Full Guide:** `GAMIFICATION_GUIDE.md`
- **Database Schema:** `supabase-gamification.sql`
- **Components:** `src/components/BadgeSystem.tsx`, `LevelSystem.tsx`, etc.

---

**All features are optional and can be disabled at any time!** 🎮
