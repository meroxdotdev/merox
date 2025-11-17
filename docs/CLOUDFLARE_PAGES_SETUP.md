# Cloudflare Pages - Disqus Environment Variable Setup

## Issue
Disqus comments work in development but don't appear on Cloudflare Pages because the environment variable isn't configured.

## ✅ Quick Fix Applied
I've added a fallback to use `merox` as the shortname if the environment variable isn't set. This means Disqus will work immediately, but you should still configure it properly.

## 🔧 Proper Setup (Recommended)

### Step 1: Add Environment Variable in Cloudflare Pages

1. Go to your Cloudflare Dashboard
2. Navigate to **Pages** → Select your project (`merox.dev` or similar)
3. Go to **Settings** → **Environment Variables**
4. Click **Add variable**
5. Add:
   - **Variable name:** `PUBLIC_DISQUS_SHORTNAME`
   - **Value:** `merox`
   - **Environment:** Select **Production** (and **Preview** if you want it in previews too)
6. Click **Save**

### Step 2: Redeploy

After adding the environment variable, you need to trigger a new deployment:

**Option A: Automatic (if connected to Git)**
- Push a commit to your repository
- Cloudflare will automatically rebuild with the new env var

**Option B: Manual**
- Go to **Deployments** tab
- Click **Retry deployment** on the latest deployment
- Or trigger a new build from your Git provider

### Step 3: Verify

1. Wait for the deployment to complete
2. Visit a blog post on your live site
3. Scroll down - you should see the Disqus comments section

## 🔍 Troubleshooting

### Comments Still Not Showing?

1. **Check Environment Variable:**
   - Go to Cloudflare Pages → Settings → Environment Variables
   - Verify `PUBLIC_DISQUS_SHORTNAME` is set to `merox`
   - Make sure it's enabled for **Production** environment

2. **Check Build Logs:**
   - Go to Deployments → Click on latest deployment
   - Check if there are any errors
   - Look for environment variable warnings

3. **Clear Cache:**
   - Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+R)
   - Or clear Cloudflare cache if you have caching enabled

4. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for any Disqus-related errors
   - Check if the script is loading: `https://merox.disqus.com/embed.js`

5. **Verify Disqus Configuration:**
   - Go to [Disqus Admin](https://merox.disqus.com/admin/)
   - Check that your site is properly configured
   - Verify trusted domains include `merox.dev`

## 📝 Important Notes

### Why Environment Variables?
- **Security:** Keeps configuration separate from code
- **Flexibility:** Easy to change without code changes
- **Best Practice:** Standard way to handle configuration

### The Fallback
I've added `'merox'` as a fallback in the code, so Disqus will work even without the env var. However, it's still recommended to set it properly in Cloudflare Pages for:
- Consistency across environments
- Easy updates if you change your Disqus shortname
- Following best practices

### Environment Variable Naming
- Must start with `PUBLIC_` for Astro to expose it to the client
- Astro only exposes `PUBLIC_*` variables to the browser
- Other variables (without `PUBLIC_`) are server-only

## ✅ Verification Checklist

- [ ] Environment variable `PUBLIC_DISQUS_SHORTNAME=merox` added in Cloudflare Pages
- [ ] Variable enabled for Production environment
- [ ] New deployment triggered after adding variable
- [ ] Deployment completed successfully
- [ ] Comments appear on blog posts
- [ ] No console errors in browser DevTools

## 🚀 After Setup

Once configured, Disqus will:
- ✅ Load lazily when users scroll near comments
- ✅ Work with Astro view transitions
- ✅ Handle errors gracefully
- ✅ Show loading indicators
- ✅ Be fully accessible

---

**Need Help?** Check Cloudflare Pages documentation or Disqus support.

