# Development vs Production Mode - Beginner's Guide

## 🎓 What You Need to Know (Beginner-Friendly!)

### What is "Development Mode"?

**Development mode** is when you're working on the app on your own computer. Think of it like a "practice mode" where:
- ✅ You can test features safely
- ✅ Changes appear immediately when you save files
- ✅ Special testing tools are available (like the test buttons)
- ✅ It's just you - no one else can see what you're doing

**How to use it:**
Just type `npm run dev` in your terminal and press Enter!

### What is "Production Mode"?

**Production mode** is the final version that real users will see when the app is deployed to the hospital. Think of it like the "real thing" where:
- ✅ Everything is optimized and fast
- ✅ Test features are hidden (so users don't see them)
- ✅ It's ready for real people to use
- ✅ No mistakes or test stuff visible

**How to create it:**
Type `npm run build` in your terminal - this creates the final version!

### The AUTOMATIC Magic ✨

**Good news:** You don't need to configure anything!

- When you run `npm run dev` → Test buttons **automatically appear** 🎉
- When you run `npm run build` → Test buttons **automatically disappear** 🔒

**No settings to remember, no files to edit** - it just works!

---

## Overview

This guide explains how to switch between development and production modes for the NHS Supplier Setup Smart Form. Test features automatically appear in development mode and are automatically hidden in production builds.

---

## ⚡ AUTOMATIC BEHAVIOR (No Configuration Needed!)

### Development Mode - Test Features Enabled Automatically

**When you run:** `npm run dev`

**Test buttons automatically appear** - no configuration needed!

- ✅ Test Authorization buttons at bottom of Section 7
- ✅ Blue banner saying "Development Testing Tools"
- ✅ Can test all review workflows (PBP, Procurement, OPW, AP Control, Requester)
- ✅ Hot module reload (changes appear instantly)

**No `.env` configuration required** - just run `npm run dev` and test buttons are there!

### Production Build - Test Features Automatically Hidden

**When you run:** `npm run build`

**Test buttons NEVER appear** - fail-safe production build!

- ❌ No test authorization buttons (impossible to enable)
- ❌ No debug logging
- ❌ No development features
- ✅ Optimized production bundle
- ✅ Production-ready code

**Safety:** Even if you accidentally set environment variables, test buttons will NEVER appear in production builds.

---

## 🔄 How It Works

### The Magic Behind Automatic Behavior

**Code uses:** `!import.meta.env.PROD`

| Build Command | PROD Value | Test Buttons |
|---------------|------------|--------------|
| `npm run dev` | `false` | ✅ Always visible |
| `npm run build` | `true` | ❌ Never visible |
| `npm run preview` | `true` | ❌ Never visible |

**Why this is safe:**
- `PROD` is set by Vite based on build mode (not an environment variable)
- Impossible to accidentally enable in production
- Developers don't need to remember to set flags
- Production builds are fail-safe

---

## 🚀 Quick Start

### For Development (Test Buttons Enabled)

**Just run:**
```bash
npm run dev
```

**That's it!** Test buttons will automatically appear at the bottom of Section 7.

**No `.env` file needed** for test buttons to work!

### For Production Preview (Test Buttons Disabled)

**Build and preview:**
```bash
npm run build
npm run preview
```

**Test buttons will NOT appear** - this is what production looks like.

### Production Mode (no Test Features)

**Purpose:** Production deployment, client demonstrations, final testing

**Configuration:**

1. **`.env.production` already configured** (no changes needed):
   ```bash
   # .env.production (production without test features)
   VITE_ENABLE_TEST_BUTTONS=false
   VITE_ENABLE_DEBUG_LOGGING=false
   VITE_ENABLE_MOCK_AUTH=false

   VITE_API_URL=https://your-production-url/api
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Preview production build locally:**
   ```bash
   npm run preview
   ```

4. **What you'll see:**
   - ❌ No test authorization buttons
   - ❌ No debug logging
   - ❌ No development features
   - ✅ Optimized production bundle
   - ✅ Production-ready code

---

## 🎛️ Environment Variables Reference

### Test Authorization Buttons

**Automatic Behavior:** Test buttons show/hide based on build mode

| Build Mode | Command | Test Buttons | Why |
|------------|---------|--------------|-----|
| Development | `npm run dev` | ✅ Always visible | For testing workflows |
| Production | `npm run build` | ❌ Never visible | Safety (fail-safe) |

**No environment variable needed!** The behavior is automatic.

**How it works:**
- Code checks: `!import.meta.env.PROD`
- Vite sets `PROD` based on build command
- Developer-friendly AND production-safe

**Controls:**
- Test buttons at bottom of Section 7 (Review & Submit)
- "1. PBP Review", "2. Procurement", "3. OPW Panel", "4. AP Control", "5. Requester" buttons
- Blue "Development Testing Tools" banner

**File:** [src/components/sections/Section7ReviewSubmit.jsx](../src/components/sections/Section7ReviewSubmit.jsx#L642)

### Debug Logging

**Variable:** `VITE_ENABLE_DEBUG_LOGGING`

| Value | Effect | Use Case |
|-------|--------|----------|
| `true` | Shows debug logs | Troubleshooting, debugging |
| `false` | No debug logs | Production, clean console |

**Note:** Currently all debug console.log statements have been removed, so this flag has no effect. Kept for future use.

### Mock Authentication

**Variable:** `VITE_ENABLE_MOCK_AUTH`

| Value | Effect | Use Case |
|-------|--------|----------|
| `true` | Bypasses Azure AD | Local testing without Azure AD |
| `false` | Requires Azure AD | Production, realistic testing |

**WARNING:** Never set to `true` in production!

---

## 📁 Environment Files

### File Structure

```
project-root/
├── .env                    # Local development (git ignored)
├── .env.production         # Production build (committed to git)
├── .env.development        # Development defaults (optional)
└── .env.local             # Your personal settings (git ignored)
```

### Precedence (Highest to Lowest)

1. `.env.local` - Your personal overrides (git ignored)
2. `.env` - Local development (git ignored)
3. `.env.development` - Development defaults
4. `.env.production` - Production settings (used with `npm run build`)

### Which File is Used?

| Command | File Used | Purpose |
|---------|-----------|---------|
| `npm run dev` | `.env` or `.env.development` | Development server |
| `npm run build` | `.env.production` | Production build |
| `npm run preview` | `.env.production` | Preview production build |

---

## 🧪 Common Development Scenarios

### Scenario 1: Use Test Buttons for Development

**Goal:** Test authorization workflows while developing

**Steps:**

1. **Just run the dev server** - test buttons appear automatically:
   ```bash
   npm run dev
   ```

2. Navigate to Section 7 (Review & Submit)

3. Scroll to bottom - you'll see blue "Development Testing Tools" banner and test buttons

4. Click buttons to test workflows:
   - "1. PBP Review" → Opens PBP review page
   - "2. Procurement" → Opens Procurement classification page
   - "3. OPW Panel" → Opens OPW/IR35 review page
   - "4. AP Control" → Opens AP Control processing page
   - "5. Requester" → Opens requester response page

**That's it!** No configuration needed - test buttons are automatic in development mode.

### Scenario 2: Test Production Build Locally

**Goal:** See exactly what users will see in production

**Steps:**

1. Build for production:
   ```bash
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

3. Open browser to: http://localhost:4173

4. Verify:
   - ❌ No test buttons visible
   - ❌ No debug output in console
   - ✅ Production-ready experience

### Scenario 3: Hide Test Buttons Temporarily

**Goal:** See what the app looks like without test buttons (like production)

**Steps:**

1. Build the production version:
   ```bash
   npm run build
   ```
   *(This creates an optimized version without test features)*

2. Preview the production version:
   ```bash
   npm run preview
   ```
   *(This lets you see the production version on your computer)*

3. Open your browser to: http://localhost:4173

4. Navigate to Section 7 - **test buttons will NOT appear**

**To go back to development with test buttons:**
```bash
# Stop the preview (press Ctrl+C in the terminal)
npm run dev
# Test buttons are back!
```

### Scenario 4: Client Demonstration

**Goal:** Show client the production experience without deploying

**Steps:**

1. Ensure `.env.production` has:
   ```bash
   VITE_ENABLE_TEST_BUTTONS=false
   ```

2. Build and preview:
   ```bash
   npm run build && npm run preview
   ```

3. Open: http://localhost:4173

4. Walk through form as client would see it

---

## 🎯 Quick Reference Commands

### Development with Test Features
```bash
# Create .env with test buttons enabled
echo "VITE_ENABLE_TEST_BUTTONS=true" > .env

# Run dev server
npm run dev

# Open: http://localhost:5173
```

### Production Preview (No Test Features)
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Open: http://localhost:4173
```

### Clean Production Build
```bash
# Remove previous build
rm -rf dist

# Fresh production build
npm run build

# Verify dist/ folder contents
ls -la dist/
```

---

## 🔍 Verification Checklist

### Before Deploying to Production

- [ ] `.env.production` has `VITE_ENABLE_TEST_BUTTONS=false`
- [ ] `.env.production` has `VITE_ENABLE_DEBUG_LOGGING=false`
- [ ] `.env.production` has `VITE_ENABLE_MOCK_AUTH=false`
- [ ] Run `npm run build` successfully
- [ ] Run `npm run preview` and verify:
  - [ ] No test buttons visible
  - [ ] No console errors
  - [ ] Form works as expected
  - [ ] All sections load correctly
- [ ] Check `dist/` folder size (should be < 2MB)
- [ ] Verify Azure AD login works (if configured)

### Before Starting Development Session

- [ ] `.env` file exists in project root
- [ ] `VITE_ENABLE_TEST_BUTTONS=true` (if you need test buttons)
- [ ] Backend API running (`cd supplier-form-api && npm run dev`)
- [ ] Frontend dev server running (`npm run dev`)
- [ ] Browser console shows no errors

---

## 🐛 Troubleshooting

### Issue: Test buttons not showing in development

**Possible causes:**
1. `VITE_ENABLE_TEST_BUTTONS` not set to `true`
2. `.env` file doesn't exist
3. Server not restarted after changing .env

**Solutions:**

1. **Check .env file exists:**
   ```bash
   cat .env
   ```

2. **Verify the value:**
   ```bash
   grep VITE_ENABLE_TEST_BUTTONS .env
   # Should show: VITE_ENABLE_TEST_BUTTONS=true
   ```

3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

4. **Clear browser cache:**
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

### Issue: Test buttons visible in production build

**This is CRITICAL - do NOT deploy!**

**Check:**

1. **Verify .env.production:**
   ```bash
   grep VITE_ENABLE_TEST_BUTTONS .env.production
   # Should show: VITE_ENABLE_TEST_BUTTONS=false
   ```

2. **Rebuild:**
   ```bash
   rm -rf dist
   npm run build
   npm run preview
   ```

3. **If still visible:**
   - Check for local `.env` file overriding production
   - Remove `.env.local` if it exists
   - Rebuild completely

### Issue: Changes to .env not taking effect

**Cause:** Vite caches environment variables

**Solutions:**

1. **Restart dev server** (Ctrl+C, then `npm run dev`)
2. **Hard refresh browser** (Ctrl+Shift+R)
3. **Clear .vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

---

## 📊 Feature Flag Matrix

| Feature | Dev (.env) | Production (.env.production) | Purpose |
|---------|-----------|------------------------------|---------|
| **Test Buttons** | `true` | `false` | Workflow testing |
| **Debug Logging** | `false` | `false` | Console debugging |
| **Mock Auth** | `false` | `false` | Bypass Azure AD |

**Rule of Thumb:**
- Development: Enable features you need for testing
- Production: ALL flags set to `false`

---

## 🎓 Best Practices

### DO ✅

- ✅ Keep `.env` in `.gitignore` (already done)
- ✅ Document any new environment variables
- ✅ Test production build before deploying
- ✅ Use `npm run preview` to verify production build
- ✅ Set test flags back to `false` before committing
- ✅ Use `.env.local` for personal settings (git ignored)

### DON'T ❌

- ❌ Commit `.env` files with real credentials
- ❌ Set test flags to `true` in `.env.production`
- ❌ Deploy without running `npm run build && npm run preview` first
- ❌ Mix development and production values in same .env file
- ❌ Forget to restart dev server after changing .env

---

## 🔐 Security Notes

### Environment Variables in Git

**Safe to commit:**
- ✅ `.env.production` (with placeholder values)
- ✅ `.env.example` (template with no real values)
- ✅ `.env.development` (with dev defaults)

**NEVER commit:**
- ❌ `.env` (personal development settings)
- ❌ `.env.local` (local overrides)
- ❌ Any file with real API keys or secrets

### Production Security

Before deploying to production, verify:
1. No test features enabled
2. No debug logging active
3. No mock authentication
4. Real Azure AD credentials configured
5. HTTPS enforced
6. CORS restricted to actual frontend URL

---

## 📞 Getting Help

**Environment Variable Issues:**
- Check: [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- Verify: `.env` file format (no spaces around `=`)
- Debug: Run `npm run dev -- --debug` for verbose output

**Test Button Issues:**
- File: [Section7ReviewSubmit.jsx](../src/components/sections/Section7ReviewSubmit.jsx)
- Line: 643 (test button conditional)

**Build Issues:**
- Clear cache: `rm -rf node_modules/.vite && rm -rf dist`
- Reinstall: `npm ci`
- Rebuild: `npm run build`

---

**Last Updated:** February 4, 2026

**Quick Summary:**
- **Development with test buttons:** Create `.env` with `VITE_ENABLE_TEST_BUTTONS=true`, run `npm run dev`
- **Production preview:** Run `npm run build && npm run preview`
- **Toggle:** Just change the .env file value and restart server
