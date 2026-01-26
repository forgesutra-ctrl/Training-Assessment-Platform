# GitHub Authentication Fix

You're getting a 403 error because GitHub requires authentication. Here are two solutions:

## Option 1: Use Personal Access Token (PAT) - Recommended

### Step 1: Create a Personal Access Token

1. Go to GitHub: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: `TAPS Repository Access`
4. Select expiration (30 days, 90 days, or no expiration)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
6. Click "Generate token"
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 2: Update Remote URL with Token

```powershell
# Remove current remote
git remote remove origin

# Add remote with token (replace YOUR_TOKEN with your actual token)
git remote add origin https://YOUR_TOKEN@github.com/forgesutra-ctrl/TAPS.git

# Or use your GitHub username (replace YOUR_USERNAME and YOUR_TOKEN)
git remote add origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/forgesutra-ctrl/TAPS.git
```

### Step 3: Push

```powershell
git push -u origin main
```

When prompted for password, paste your token (not your GitHub password).

---

## Option 2: Use SSH (More Secure)

### Step 1: Check if you have SSH key

```powershell
ls ~/.ssh/id_rsa.pub
```

If file doesn't exist, create one:

```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Press Enter to accept default location, then set a passphrase (optional).

### Step 2: Add SSH key to GitHub

1. Copy your public key:
```powershell
cat ~/.ssh/id_rsa.pub
```

2. Go to GitHub: https://github.com/settings/keys
3. Click "New SSH key"
4. Paste your key and save

### Step 3: Update Remote to SSH

```powershell
git remote remove origin
git remote add origin git@github.com:forgesutra-ctrl/TAPS.git
git push -u origin main
```

---

## Option 3: Use GitHub CLI (Easiest)

If you have GitHub CLI installed:

```powershell
gh auth login
gh repo create forgesutra-ctrl/TAPS --public --source=. --remote=origin --push
```

---

## Quick Fix: Update Remote URL

If you already have a token, just update the remote:

```powershell
git remote set-url origin https://YOUR_TOKEN@github.com/forgesutra-ctrl/TAPS.git
git push -u origin main
```

---

## Troubleshooting

### If you get "repository not found":
- Make sure the repository exists at https://github.com/forgesutra-ctrl/TAPS
- Check you have write access to the forgesutra-ctrl organization

### If token doesn't work:
- Make sure token has `repo` scope
- Check token hasn't expired
- Regenerate token if needed

### Clear cached credentials (Windows):

```powershell
git credential-manager erase
```

Then try pushing again - it will prompt for new credentials.
