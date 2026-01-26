# GitHub Repository Setup Guide

## Step 1: Create Repository on GitHub

1. Go to https://github.com/organizations/forgesutra-ctrl/repositories/new
   - Or navigate to: GitHub → forgesutra-ctrl organization → Repositories → New

2. Repository Settings:
   - **Repository name:** `TAPS`
   - **Description:** `Training Assessment Platform System - Complete React + TypeScript + Supabase application with advanced reporting, gamification, AI features, and micro-interactions`
   - **Visibility:** Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote (replace with your actual GitHub username if needed)
git remote add origin https://github.com/forgesutra-ctrl/TAPS.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Verify

1. Go to https://github.com/forgesutra-ctrl/TAPS
2. Verify all files are uploaded
3. Check that README.md displays correctly

## Optional: Add Repository Topics

On GitHub, go to repository settings and add topics:
- `react`
- `typescript`
- `supabase`
- `training-assessment`
- `vite`
- `tailwindcss`

## Note about sharma-coffee-hub folder

The `sharma-coffee-hub` folder appears to be a nested git repository. You have two options:

1. **Remove it** (if not needed):
   ```bash
   git rm --cached sharma-coffee-hub
   git commit -m "Remove sharma-coffee-hub folder"
   ```

2. **Keep it as a submodule** (if you want to link to another repo):
   ```bash
   git rm --cached sharma-coffee-hub
   git submodule add <repository-url> sharma-coffee-hub
   ```

3. **Include it** (if you want all files):
   ```bash
   # Remove .git from sharma-coffee-hub if it exists
   rm -rf sharma-coffee-hub/.git
   git add sharma-coffee-hub
   git commit -m "Include sharma-coffee-hub files"
   ```
