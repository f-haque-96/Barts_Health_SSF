# Companies House CRN Lookup - Beginner's Setup Guide

## 🎓 What is CRN? (Simple Explanation)

### What is a CRN?

**CRN** stands for **Company Registration Number**. It's like a unique ID number for every UK company.

**Example:**
- Tesco's CRN: `00445790`
- Your test company CRN: `12345678`

### What does "CRN Lookup" mean?

When someone enters a company's CRN in your form, the app:
1. Checks if the company is real
2. Gets the company's name and address automatically
3. Fills in the form for the user (so they don't have to type everything!)

**It's like autocomplete, but for company information!**

### Do I need to set this up?

**For Testing:** NO! We already have 4 test companies built-in.
**For Production:** YES! But it's a simple one-time setup (takes 10 minutes).

---

## Overview

The NHS Supplier Setup Form uses Companies House API to verify UK company registration numbers (CRN). This guide explains how to set it up for development, demonstration, and production.

---

## Quick Reference

| Environment | Setup Required | API Key Needed | Works With |
|-------------|----------------|----------------|------------|
| **Development (Mock Data)** | ❌ No | ❌ No | 4 pre-configured companies |
| **Development (Real API)** | ✅ Yes | ✅ Yes | Any UK company |
| **Production** | ✅ Yes | ✅ Yes | Any UK company |

---

## Option 1: Development with Mock Data (No Setup)

**Best for:** Testing, initial development, quick demos

**How it works:**
- Mock CRN data is built into the frontend
- No API key required
- No backend configuration needed

**Available Mock Companies:**

```javascript
CRN: 12345678
Company: Test Company Ltd
Status: Active
Address: 123 Test Street, London, EC1A 1BB

CRN: 00445790
Company: TESCO PLC
Status: Active
Address: Tesco House, Shire Park, Welwyn Garden City, AL7 1GA

CRN: 04234715
Company: SAINSBURY'S SUPERMARKETS LTD
Status: Active
Address: 33 Holborn, London, EC1N 2HT

CRN: 01234567
Company: Dissolved Test Company Ltd
Status: Dissolved (for testing error handling)
Address: 456 Old Street, Manchester, M1 1AA
```

**Steps:**
1. No setup required
2. Run `npm run dev`
3. Enter one of the mock CRN numbers in the form
4. Company details will auto-populate

**Limitations:**
- ❌ Only works with the 4 pre-configured companies
- ❌ Cannot lookup real companies (except Tesco and Sainsbury's)
- ✅ Perfect for development and testing

---

## Option 2: Development with Real API

**Best for:** Client demonstrations, realistic testing, development with real data

### Step 1: Register for API Key (One-Time, FREE)

1. **Go to Companies House Developer Portal:**
   - URL: https://developer.companieshouse.gov.uk/

2. **Create Account:**
   - Click "Register"
   - Fill in your email and details
   - Verify your email

3. **Register Application:**
   - Log in to developer portal
   - Click "Register an application"
   - Fill in:
     - Application name: "NHS Supplier Form - Development"
     - Description: "Development environment for NHS supplier onboarding"
     - Application URL: "http://localhost:5173" (or your dev URL)
   - Click "Register"

4. **Get API Key:**
   - You'll receive an API key (looks like: `abc123def456...`)
   - **IMPORTANT:** Save this key securely - you can't retrieve it later

### Step 2: Configure Backend

1. **Create/Edit `.env` file in `supplier-form-api/` folder:**

```bash
# Companies House API Configuration
CH_API_KEY=your_actual_api_key_here
CH_API_URL=https://api.companieshouse.gov.uk
```

2. **Restart backend server:**

```bash
cd supplier-form-api
npm uninstall csurf
npm instal csrf-csrf
npm install
npm start
```

### Step 3: Test

1. Run frontend: `npm run dev`
2. Fill out the form to Section 4 (Supplier Details)
3. Enter any valid UK CRN (e.g., `00445790` for Tesco)
4. Click "Verify CRN"
5. Company details should auto-populate from Companies House API

**Note:** If CRN lookup fails with CORS error, it will fall back to mock data automatically.

---

## Option 3: Production Setup

**Required for:** Production deployment

### Step 1: Get Production API Key

**Option A: Use Same Key as Development**
- Free tier API key works for production
- 600 requests per 5 minutes limit
- Shared rate limit with development

**Option B: Request Production Key (Recommended)**
- Register a separate application for production
- Better rate limiting control
- Separate usage tracking

### Step 2: Configure Production Environment

**On your production server** (Azure App Service, VM, etc.):

1. **Set environment variables:**

```bash
# Azure App Service Configuration
CH_API_KEY=your_production_api_key
CH_API_URL=https://api.companieshouse.gov.uk
```

**OR in your production `.env` file:**

```bash
# Companies House API Configuration
CH_API_KEY=your_production_api_key
CH_API_URL=https://api.companieshouse.gov.uk
```

2. **Verify in logs:**

After deployment, check logs for:
```
[info]: Companies House API configured
```

### Step 3: Test in Production

1. Submit a test form with a real CRN
2. Verify company details auto-populate
3. Check audit logs for successful CRN verification

---

## How CRN Verification Works

### Workflow

```
User enters CRN (e.g., 12345678)
        ↓
Frontend checks mock data first
        ↓
    Found in mock?
        ↓
    YES → Use mock data (instant)
        ↓
    NO → Call backend API
        ↓
    Backend calls Companies House API
        ↓
    Success?
        ↓
    YES → Return company details
        ↓
    NO → Show error message + fallback to manual entry
```

### Fallback Behaviour

If CRN verification fails (API down, CORS error, invalid key):
- ✅ Form still works
- ✅ User can manually enter company details
- ✅ Warning message shown to user
- ⚠️ Procurement team will need to verify manually

**This is by design** - the form never completely blocks users.

---

## Troubleshooting

### Issue: "Company not found"

**Possible causes:**
- Invalid CRN format (must be 7-8 digits)
- Company doesn't exist
- Company is dissolved

**Solutions:**
1. Check CRN format (should be like `12345678` or `01234567`)
2. Try a known valid CRN (e.g., `00445790` for Tesco)
3. If company is dissolved, form will warn user

### Issue: "CORS blocked" error

**Cause:** Browser blocking direct API calls from frontend

**Solution:** This is expected behaviour
- Backend API proxies the request
- If backend is not running, CORS error will occur
- Frontend falls back to mock data automatically

**To fix:**
1. Ensure backend (`supplier-form-api`) is running
2. Verify `CH_API_KEY` is set in backend `.env`
3. Restart backend server

### Issue: Rate limit exceeded

**Error message:** "Too many requests"

**Cause:** Free tier limit (600 requests / 5 minutes) exceeded

**Solutions:**
1. **Short-term:** Wait 5 minutes for rate limit to reset
2. **Long-term:** Request paid API tier from Companies House
3. **Development:** Use mock data for bulk testing

### Issue: API key not working

**Possible causes:**
- Key not set in `.env`
- Wrong environment file
- Key revoked

**Steps to fix:**

1. **Check .env file:**
   ```bash
   cd supplier-form-api
   cat .env | grep CH_API_KEY
   ```

2. **Verify key format:**
   - Should be alphanumeric string
   - No quotes around the value
   - No spaces

3. **Test with curl:**
   ```bash
   curl -u YOUR_API_KEY: https://api.companieshouse.gov.uk/company/00445790
   ```

4. **If still failing:** Generate new API key from Companies House portal

---

## API Rate Limits

### Free Tier

- **Rate limit:** 600 requests per 5 minutes
- **Cost:** FREE
- **Suitable for:** Most use cases (up to 120 requests/minute)

**Typical Usage:**
- Average form submission: 1-2 CRN lookups
- Expected traffic: 50-100 submissions/day
- **Plenty of headroom** for normal use

### Paid Tier (If Needed)

If you exceed rate limits frequently:
1. Contact Companies House: enquiries@companieshouse.gov.uk
2. Request higher rate limit
3. Discuss pricing (typically £££ per month)

**Note:** Most organisations NEVER need paid tier.

---

## Security Best Practices

### ✅ DO

- ✅ Store API key in `.env` file (never in code)
- ✅ Add `.env` to `.gitignore`
- ✅ Use different keys for dev and production
- ✅ Proxy API calls through backend (never expose key in frontend)
- ✅ Rotate API keys annually

### ❌ DON'T

- ❌ Commit API keys to git
- ❌ Share API keys in emails or Slack
- ❌ Use production API key in development
- ❌ Call Companies House API directly from frontend (CORS issues)

---

## Maintenance

### One-Time Setup

✅ **API key never expires** (unless you revoke it)
✅ **No ongoing maintenance required**
✅ **No renewal needed**

### Annual Review (Recommended)

**Once per year:**
1. Check API usage in Companies House portal
2. Verify rate limits are sufficient
3. Rotate API key (security best practise)
4. Update documentation if API changes

---

## Quick Command Reference

### Get an API Key
```
Visit: https://developer.companieshouse.gov.uk/
```

### Configure Development
```bash
# In supplier-form-api/.env
CH_API_KEY=your_dev_key
CH_API_URL=https://api.companieshouse.gov.uk
```

### Test CRN Lookup (via curl)
```bash
# Replace YOUR_KEY with actual API key
curl -u YOUR_KEY: https://api.companieshouse.gov.uk/company/00445790
```

### Check Backend Logs
```bash
cd supplier-form-api
npm run dev
# Look for: "Companies House API configured"
```

### Test with Mock Data (No API Key)
```bash
# Just use these CRNs in the form:
12345678, 00445790, 04234715, 01234567
```

---

## Summary

| Scenario | Setup Steps | Time Required |
|----------|-------------|---------------|
| **Quick Testing** | Use mock CRN numbers | 0 minutes |
| **Development** | Register API key + configure .env | 10 minutes (one-time) |
| **Production** | Same as development | Already done! |

**Bottom Line:**
- For testing: Use mock data (no setup)
- For production: 10-minute one-time setup, then forget forever

---

## Support

**Companies House API Support:**
- Email: enquiries@companieshouse.gov.uk
- Developer Forum: https://developer.companieshouse.gov.uk/developer-forum

**Technical Issues:**
- Check backend logs: `supplier-form-api/logs/`
- Verify .env configuration
- Test with curl command above

---

**Last Updated:** February 4, 2026
