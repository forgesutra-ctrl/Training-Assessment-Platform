# Vercel Build Fix - Path Resolution Issue

## Error
```
Failed to resolve /src/main.tsx from /vercel/path0/index.html
```

## Solution

The issue is that Vercel's build environment might have a different working directory. The build works locally but fails on Vercel.

### Fix Applied

1. **Updated `vite.config.ts`**: Added explicit `root` configuration
2. **Simplified `vercel.json`**: Removed rewrites (Vercel handles this automatically for Vite)

### Alternative Solutions (if issue persists)

#### Option 1: Check Vercel Build Settings
- Go to Vercel Dashboard → Project Settings → General
- Verify "Root Directory" is set to `.` (not specified)
- Verify "Build Command" is `npm run build`
- Verify "Output Directory" is `dist`

#### Option 2: Use Relative Path in index.html
If the absolute path doesn't work, try changing `index.html`:
```html
<!-- Change from: -->
<script type="module" src="/src/main.tsx"></script>

<!-- To: -->
<script type="module" src="./src/main.tsx"></script>
```

#### Option 3: Check File Structure
Ensure `src/main.tsx` exists and is in the correct location:
```
TAPS/
  ├── index.html
  ├── src/
  │   └── main.tsx
  └── vite.config.ts
```

#### Option 4: Clear Vercel Cache
1. Go to Vercel Dashboard → Deployments
2. Click on the failed deployment
3. Click "Redeploy" → "Use existing Build Cache" (uncheck this)
4. Redeploy

## Current Status

✅ Build works locally
❌ Build fails on Vercel with path resolution error

## Next Steps

1. Commit and push the updated `vite.config.ts`
2. If still failing, try Option 2 (relative path)
3. Check Vercel build logs for more details
