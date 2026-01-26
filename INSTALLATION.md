# Step-by-Step Installation Guide

This guide will walk you through setting up the Training Assessment System from scratch.

## Prerequisites

Before starting, make sure you have:
- **Node.js** version 18 or higher installed
  - Check by running: `node --version` in your terminal
  - Download from: https://nodejs.org/ if needed
- A code editor (like VS Code) - optional but recommended

## Step 1: Install All Dependencies

Open your terminal (Command Prompt or PowerShell on Windows) in the project folder and run:

```bash
npm install
```

**What this does:** Downloads and installs all the packages listed in `package.json` (React, TypeScript, Vite, Tailwind CSS, Supabase, etc.)

**Expected output:** You'll see a progress bar and then "added X packages" message. This may take 2-5 minutes.

**If you get errors:**
- Make sure you're in the correct folder (the one with `package.json`)
- Try deleting `node_modules` folder and `package-lock.json` file, then run `npm install` again

## Step 2: Set Up Supabase Environment Variables

### 2a. Create the .env file

**On Windows (PowerShell):**
```powershell
copy .env.example .env
```

**On Windows (Command Prompt):**
```cmd
copy .env.example .env
```

**On Mac/Linux:**
```bash
cp .env.example .env
```

### 2b. Get Your Supabase Credentials

1. Go to https://supabase.com and sign up for a free account (if you don't have one)
2. Click "New Project"
3. Fill in your project details:
   - Name: "Training Assessment System" (or any name)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose closest to you
4. Wait for the project to be created (takes 1-2 minutes)

### 2c. Copy Your API Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (gear icon) in the left sidebar
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

### 2d. Update Your .env File

1. Open the `.env` file in a text editor (Notepad, VS Code, etc.)
2. Replace the placeholder values:
   ```
   VITE_SUPABASE_URL=https://your-actual-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```
3. Save the file

**Important:** Never commit the `.env` file to Git! It's already in `.gitignore`.

## Step 3: Start the Development Server

Run this command in your terminal:

```bash
npm run dev
```

**What this does:** Starts the Vite development server with hot-reload enabled.

**Expected output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 4: Open in Your Browser

1. Open your web browser (Chrome, Firefox, Edge, etc.)
2. Go to: **http://localhost:5173**
3. You should see the login page!

## Step 5: Test the Application

1. You'll see the login page with a beautiful blue/purple theme
2. Try navigating to different pages:
   - http://localhost:5173/login
   - http://localhost:5173/manager
   - http://localhost:5173/trainer
   - http://localhost:5173/admin

## Troubleshooting

### "Port 5173 is already in use"
- Vite will automatically use the next available port (like 5174)
- Check the terminal output for the actual port number
- Or stop the other application using port 5173

### "Cannot find module" errors
- Make sure you ran `npm install` successfully
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

### "Supabase connection failed"
- Double-check your `.env` file has the correct values
- Make sure there are no extra spaces or quotes around the values
- Verify your Supabase project is active (not paused)

### "Page not found" or blank page
- Make sure the development server is running (`npm run dev`)
- Check the browser console (F12) for errors
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Next Steps

Once everything is running:

1. **Set up authentication in Supabase:**
   - Go to Authentication → Settings in Supabase dashboard
   - Enable Email authentication
   - Create a test user

2. **Create database tables:**
   - Go to Table Editor in Supabase
   - Create tables for users, trainings, assessments, etc.

3. **Customize the application:**
   - Modify the pages in `src/pages/`
   - Update styles in `src/index.css` and `tailwind.config.js`
   - Add your business logic

## Useful Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Check code for errors

## Getting Help

- Check the browser console (F12) for error messages
- Review the README.md file for more information
- Check Supabase documentation: https://supabase.com/docs
- Check Vite documentation: https://vitejs.dev

---

**You're all set!** The application should now be running on http://localhost:5173
