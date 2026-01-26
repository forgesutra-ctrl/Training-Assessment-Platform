# Quick Start - Terminal Commands

Copy and paste these commands one by one into your terminal.

## 1. Install Dependencies
```bash
npm install
```
⏱️ This takes 2-5 minutes. Wait for it to finish.

## 2. Create Environment File (Windows PowerShell)
```powershell
copy .env.example .env
```

**OR if using Command Prompt:**
```cmd
copy .env.example .env
```

**OR if using Mac/Linux:**
```bash
cp .env.example .env
```

## 3. Edit .env File
1. Open `.env` in a text editor
2. Add your Supabase credentials (see INSTALLATION.md for details)

## 4. Start Development Server
```bash
npm run dev
```

## 5. Open Browser
Go to: **http://localhost:5173**

---

## That's it! 🎉

Your application should now be running.

**To stop the server:** Press `Ctrl + C` in the terminal

**To start again later:** Just run `npm run dev` again
