# Simple Setup Instructions - One SQL File

**The easiest way to set up everything!**

---

## 🎯 What You Need to Do

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Copy and Paste ONE File

1. Open `MASTER_SETUP.sql` in your project folder
2. **Select ALL** (Ctrl+A or Cmd+A)
3. **Copy** (Ctrl+C or Cmd+C)
4. **Paste** into Supabase SQL Editor (Ctrl+V or Cmd+V)
5. Click **"Run"** (or press Ctrl+Enter)

**That's it!** ✅

---

## ✅ What This Creates

The `MASTER_SETUP.sql` file includes **EVERYTHING**:

- ✅ Main tables (teams, profiles, assessments)
- ✅ Audit log system
- ✅ Data validation constraints
- ✅ Gamification system (badges, XP, goals, streaks)
- ✅ All functions and triggers
- ✅ All RLS policies
- ✅ All indexes
- ✅ Default badges

**No need to run multiple files!**

---

## 🔍 Verify It Worked

After running, you should see:
- ✅ Success message (or no errors)
- ✅ Tables created in Supabase Dashboard → Table Editor
- ✅ Functions created in Supabase Dashboard → Database → Functions

---

## 📝 Next Steps

1. **Create users** in Supabase Auth (Authentication → Users)
2. **Run seed script** (optional): `npm run seed`
3. **Start app**: `npm run dev`
4. **Test login** with your users

---

## 🆘 If You Get Errors

**Common issues:**

1. **"Permission denied"** → Make sure you're using the SQL Editor (not a restricted view)
2. **"Already exists"** → That's OK! The script is idempotent and will update existing objects
3. **"Syntax error"** → Check that you copied the ENTIRE file (from start to end)

**If errors persist:**
- Check the error message line number
- Verify you copied the complete file
- Try running in smaller sections (though the whole file should work)

---

## 📚 Alternative: Step-by-Step Setup

If you prefer to run scripts separately, see:
- `COMPLETE_SETUP_GUIDE.md` - Detailed step-by-step instructions

---

**That's all you need! Just one file, one copy-paste, one click!** 🚀
