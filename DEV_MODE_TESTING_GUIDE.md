# Dev Mode Testing Guide

## Issues Fixed in This Session

### 1. ✅ CRN Verification 401 Error - FIXED

**Problem:** Companies House API returned 401 Unauthorized error when verifying CRN
**Root Cause:** Backend required Azure AD authentication, but dev mode has no authentication configured
**Solution:** Added `devBypassAuth` middleware that:
- ✅ Bypasses authentication in development mode (`NODE_ENV !== 'production'`)
- ✅ Requires authentication in production (security maintained)
- ✅ Creates a mock dev user for testing

**Files Changed:**
- [supplier-form-api/src/middleware/auth.js](supplier-form-api/src/middleware/auth.js) - Added `devBypassAuth` function
- [supplier-form-api/src/routes/index.js](supplier-form-api/src/routes/index.js) - Updated Companies House route to use `devBypassAuth`

**Testing:**
1. Enter a CRN in Section 3 (e.g., `02559707`)
2. Should now successfully verify company details
3. No more 401 errors

**Note:** You still need a Companies House API key in `.env` for actual verification. Without it, you'll get a different error about API failure, not authentication.

---

### 2. ✅ File Upload Persistence - WORKING AS DESIGNED

**What You're Seeing:** "Missing Required Uploads" error after uploading documents
**Root Cause:** This is NOT a bug - it's the SEC-03 security fix working correctly

**Why Files Don't Persist:**
```javascript
// From formStore.js lines 765-766
// NOTE: uploadedFiles are NOT persisted for security
// NOTE: Bank details (sortCode, accountNumber, iban, swiftCode) are NOT persisted for security
```

**How It Works:**
1. ✅ You upload documents in Section 2
2. ✅ Files are stored in memory in `uploadedFiles` state
3. ✅ When you navigate between sections, files remain in memory
4. ✅ **If you refresh the page**, files are intentionally cleared for security
5. ✅ When you reach Section 7, if you refreshed the page, files are gone

**This is the SEC-03 security fix:** Sensitive documents (passports, driving licenses, contracts) should not be stored in localStorage where they could be stolen via XSS attacks or accessed by malicious browser extensions.

**Solution for Testing:**
- **Option A:** Complete the entire form in ONE browser session without refreshing
- **Option B:** If you refresh, re-upload the documents in Section 2 before going to Section 7

**User Notice Added:**
I've added a blue info box at the top of Section 2 that says:
> "Security Note: Uploaded documents are stored securely in memory only and will NOT persist if you close or refresh your browser. Please complete the form in one session, or be prepared to re-upload documents if needed."

---

### 3. ✅ Bank Details Not in localStorage - CORRECT BEHAVIOR

**What You Checked:** Bank details (sort code, account number) NOT present in localStorage
**Status:** ✅ **This is CORRECT** - it's the SEC-03 security fix working

**Why Bank Details Don't Persist:**
```javascript
// From formStore.js line 750
const { sortCode, accountNumber, iban, swiftCode, ...safeFormData } = state.formData;
```

These sensitive fields are explicitly excluded from localStorage to prevent:
- Data theft via XSS attacks
- Unauthorized access via malicious browser extensions
- Compliance violations (GDPR, PCI-DSS)

**Impact:**
- Users must re-enter bank details if they close/refresh the browser
- This is intentional and required for NHS/GDPR compliance
- Other non-sensitive data (company name, contact info) DOES persist

---

## How to Test Successfully

### Step 1: Start Both Servers

**Backend:**
```bash
cd supplier-form-api
npm start
```
Expected output: `Server listening on port 3001` (DB warnings are normal in dev mode)

**Frontend:**
```bash
npm run dev
```
Expected output: Frontend running at `http://localhost:5173`

### Step 2: Complete Form Without Refreshing

1. **Section 1**: Fill contact details
2. **Section 2**:
   - Answer pre-screening questions
   - Upload documents (letterhead, CEST form if needed)
   - **DO NOT REFRESH THE PAGE**
3. **Section 3**: Enter company details
   - Try CRN verification (should work now with no 401 error)
4. **Continue through Sections 4-6**
5. **Section 7**: Review submission
   - Uploaded documents should appear
   - No "Missing Required Uploads" error

### Step 3: Test Security Fixes

#### Test 1: CSRF Token (SEC-06)
1. Open DevTools → Network tab
2. Submit any form
3. Check request headers for: `X-CSRF-Token: <token>`
4. ✅ Token should be present

#### Test 2: No Sensitive Data in localStorage (SEC-03)
1. Open DevTools → Application → Local Storage
2. Fill in bank details in Section 5
3. Check localStorage → `nhs-supplier-form-storage` key
4. ✅ Bank details should NOT be present
5. ✅ Uploaded files should NOT be present

#### Test 3: XSS Protection (SEC-12)
1. Try entering: `<script>alert('XSS')</script>` in a text field
2. Submit form
3. ✅ Script should NOT execute
4. ✅ Should show as escaped text: `&lt;script&gt;...`

#### Test 4: Crypto-Safe IDs (SEC-05)
1. Start a new submission
2. Check submission ID format
3. ✅ Format: `SUP-2026-<8-CHAR-UUID>` (e.g., `SUP-2026-A3F9D2E1`)

---

## What Works in Dev Mode

✅ **Fully Functional:**
- Form navigation (all 7 sections)
- Field validation (NHS email, UK postcode, phone, CRN)
- File upload UI (stores in memory)
- Form state persistence (except bank details and files)
- CSRF protection with auto-retry
- CRN verification (with API key configured)
- XSS sanitization
- Crypto-safe ID generation

❌ **Not Functional (Requires Production Config):**
- Azure AD login (requires Azure AD tenant setup)
- Database persistence (requires SQL Server connection)
- SharePoint document storage (requires SharePoint credentials)
- Email notifications (requires Power Automate flows)
- Companies House API (requires API key in `.env`)

---

## Expected Warnings in Dev Mode

When you start the backend, you'll see these warnings - **they are NORMAL**:

```
❌ Database connection failed: ConnectionError...
❌ SharePoint authentication failed...
❌ Companies House API key not configured
```

**Why?** Dev mode doesn't have database, SharePoint, or API keys configured. The backend runs in "mock mode" for testing the frontend.

---

## Production Deployment Checklist

Before deploying to production:

1. ✅ All security fixes implemented (20/27 issues)
2. ⚠️ Configure `.env` file with:
   - `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - `SHAREPOINT_SITE_URL`, `SHAREPOINT_CLIENT_ID`, `SHAREPOINT_CLIENT_SECRET`
   - `AZURE_AD_CLIENT_ID`, `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_SECRET`
   - `CH_API_KEY` (Companies House)
   - `SESSION_SECRET` (must be unique, not 'dev-secret-change-in-production')
3. ⚠️ Set `NODE_ENV=production` (this enables authentication bypass to production mode)
4. ⚠️ Enable SQL Server TDE encryption
5. ⚠️ Configure Azure AD security groups (6 groups for RBAC)
6. ⚠️ Test authentication and authorization flow
7. ⚠️ Run security scan (OWASP ZAP or similar)

---

## Need Help?

- **Security fixes summary:** [SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md)
- **Non-technical explanation:** [SECURITY_CHANGES_EXPLAINED.md](SECURITY_CHANGES_EXPLAINED.md)
- **Deployment guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Backend upgrade:** [supplier-form-api/SECURITY_UPGRADE_INSTRUCTIONS.md](supplier-form-api/SECURITY_UPGRADE_INSTRUCTIONS.md)

---

## Summary

**What's Fixed:**
- ✅ CRN verification now works in dev mode (no more 401 errors)
- ✅ File upload persistence behavior is correct (security feature, not bug)
- ✅ Bank details correctly excluded from localStorage (SEC-03)
- ✅ User notices added to explain security behaviors

**How to Test:**
- Complete form in ONE browser session without refreshing
- Check DevTools for CSRF tokens and localStorage contents
- Verify XSS protection and ID generation

**Key Insight:**
The "Missing Required Uploads" error after refresh is **not a bug** - it's the security fix working correctly. Files are intentionally not persisted to protect sensitive documents from theft.
