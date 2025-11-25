# Deployment Guide

This guide will help you deploy Discovery Atlas to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Supabase project set up

## Step 1: Prepare Your Code

### 1.1 Ensure all changes are committed

```bash
git status
git add .
git commit -m "Prepare for deployment"
```

### 1.2 Verify .gitignore is correct

Make sure `.gitignore` includes:
- `.env` files
- `node_modules/`
- `dist/`
- `.vercel/`

## Step 2: Push to GitHub

### 2.1 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository
3. **Don't** initialize with README, .gitignore, or license (we already have these)

### 2.2 Push Your Code

```bash
# If you haven't initialized git yet
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### 3.1 Sign Up / Login to Vercel

1. Go to https://vercel.com
2. Sign up or login (use "Continue with GitHub" for easy integration)

### 3.2 Import Project

1. Click **"New Project"** or **"Add New..." → "Project"**
2. Import your GitHub repository
3. Vercel will auto-detect it's a Vite project

### 3.3 Configure Project Settings

Vercel should auto-detect:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-2 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Step 4: Configure Supabase

### 4.1 Update Auth Settings

1. Go to your Supabase Dashboard
2. Navigate to **Authentication → URL Configuration**
3. Add your Vercel URL:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: Add `https://your-project.vercel.app/**`

### 4.2 Update CORS (if needed)

If you encounter CORS errors:
1. Go to **Settings → API**
2. Check that your Vercel domain is allowed

## Step 5: Test Your Deployment

1. Visit your Vercel URL
2. Test authentication (sign up/login)
3. Test core features
4. Check browser console for any errors

## Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy new commits to `main` branch to production
- Create preview deployments for pull requests
- Rebuild on every push

## Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings → Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update Supabase Auth URLs with your custom domain

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Verify `package.json` has correct build script
- Ensure all dependencies are listed in `package.json`

### Environment Variables Not Working

- This project doesn't require environment variables - it's pre-configured
- If you want to use custom Supabase credentials, update `src/integrations/supabase/client.ts`

### Supabase Connection Issues

- Check Supabase Auth URL configuration
- Ensure CORS is properly configured
- Verify Supabase project is active

### 404 Errors on Routes

- Verify `vercel.json` has the rewrite rule
- Check that React Router is configured correctly

## Monitoring

- **Vercel Analytics**: Enable in project settings
- **Error Tracking**: Check Vercel logs
- **Performance**: Use Vercel's built-in analytics

## Rollback

If something goes wrong:
1. Go to **Deployments** tab in Vercel
2. Find the last working deployment
3. Click **"..." → "Promote to Production"**

## Next Steps

- Set up custom domain
- Enable Vercel Analytics
- Configure preview deployments
- Set up monitoring and alerts

