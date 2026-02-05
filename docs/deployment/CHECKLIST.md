# NHS Supplier Setup Form - Production Deployment Checklist

**Version:** 4.0
**Last Updated:** February 3, 2026
**For:** Barts Health NHS Trust

---

## ⚠️ IMPORTANT: Security Updates (February 2026)

**All critical bugs have been fixed. This checklist has been updated to reflect new security features:**

- ✅ CSRF protection enabled
- ✅ Server-side validation on all routes
- ✅ Magic number file validation
- ✅ SESSION_SECRET enforcement (no default)
- ✅ Environment variable validation
- ✅ Enhanced health check
- ✅ SQL injection vulnerability fixed
- ✅ SharePoint service rewritten
- ✅ Duplicate vendor detection implemented
- ✅ Document access audit logging

**See [CHANGES_IMPLEMENTED.md](../archive/CHANGES_IMPLEMENTED.md) for complete details.**

---

## Pre-Deployment Checklist

### 1. Azure AD App Registration

- [ ] Create App Registration in Azure Portal
- [ ] Configure redirect URIs (VerseOne intranet URL)
- [ ] Note down: Client ID, Tenant ID
- [ ] Create client secret (for backend)
- [ ] Configure API permissions:
  - [ ] Microsoft Graph: User.Read
  - [ ] Microsoft Graph: GroupMember.Read.All
- [ ] Grant admin consent

### 2. AD Security Groups

Create these groups and add members:

| Group Name | Purpose | Members |
|------------|---------|---------|
| `NHS-SupplierForm-PBP` | PBP Panel reviewers | PBP team |
| `NHS-SupplierForm-Procurement` | Procurement reviewers | Procurement team |
| `NHS-SupplierForm-OPW` | OPW/IR35 reviewers | OPW panel |
| `NHS-SupplierForm-Contract` | Contract drafters | Contract team |
| `NHS-SupplierForm-APControl` | AP Control team | AP team |
| `NHS-SupplierForm-Admin` | System administrators | IT admins |

### 3. SQL Server Database

- [ ] Create database: `NHSSupplierForms`
- [ ] Run SQL schema scripts (see `supplier-form-api/database/schema.sql`)
- [ ] Create SQL user for API with appropriate permissions
- [ ] Test connection from backend server

Required tables:
- `Submissions`
- `SubmissionDocuments`
- `AuditTrail`
- `VendorsReference`

### 4. SharePoint Setup

- [ ] Create SharePoint site: `NHS-Supplier-Forms`
- [ ] Create document libraries:
  - [ ] `SupplierDocuments` (business documents - can sync to Alemba)
  - [ ] `SensitiveDocuments` (passports, ID docs - NEVER sync to Alemba)
- [ ] Configure permissions for document libraries
- [ ] Create App Registration for SharePoint access (client credentials flow)

### 5. Backend API Deployment (Azure App Service)

- [ ] Create Azure App Service (Node.js 18+)
- [ ] Install dependencies (npm install) - **NEW: express-session, csurf, cookie-parser added**
- [ ] Configure environment variables:

**⚠️ CRITICAL:** API will NOT start if required variables are missing.

```env
# ===== REQUIRED VARIABLES =====

# Azure AD (REQUIRED)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# SQL Server (REQUIRED)
DB_HOST=your-sql-server.database.windows.net
DB_NAME=NHSSupplierForms
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# SharePoint (REQUIRED)
SP_SITE_URL=https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms
SP_CLIENT_ID=sharepoint-app-client-id
SP_CLIENT_SECRET=sharepoint-app-secret
SP_TENANT_ID=your-tenant-id

# ⚠️ SESSION_SECRET (REQUIRED - NO DEFAULT)
# Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=<GENERATE_RANDOM_32_CHAR_STRING>

# ===== OPTIONAL VARIABLES =====

# Companies House API (Optional)
CH_API_KEY=your-companies-house-api-key
CH_API_URL=https://api.company-information.service.gov.uk

# Application
NODE_ENV=production
API_PORT=3001
CORS_ORIGIN=https://weshare.bartshealth.nhs.uk

# Security
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
```

- [ ] **Generate SESSION_SECRET** (CRITICAL - see [01-environment.md Part C](setup/01-environment.md) for 3 easy methods)
- [ ] Deploy backend code
- [ ] Test API endpoints
- [ ] **NEW:** Test health check shows database and SharePoint connected
- [ ] **NEW:** Test CSRF token endpoint returns valid token
- [ ] Configure SSL certificate
- [ ] Set up Application Insights (optional)

### CSRF Token Integration (Beginner-Friendly)

**What is CSRF?** Cross-Site Request Forgery protection prevents attackers from submitting forms on behalf of users.

**How it works:**
1. Frontend fetches a special token from the backend
2. Includes this token with every form submission
3. Backend verifies the token before processing

**Frontend Example (JavaScript):**
```javascript
// Fetch CSRF token before submitting form
async function submitForm(formData) {
  // Step 1: Get CSRF token
  const response = await fetch('/api/csrf-token', {
    credentials: 'include' // Include cookies
  });
  const { csrfToken } = await response.json();

  // Step 2: Include token in form submission
  const submitResponse = await fetch('/api/submissions', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken  // Include the token!
    },
    body: JSON.stringify(formData)
  });

  return submitResponse.json();
}
```

**Backend receives:** Token is automatically validated by CSRF middleware before reaching your code.

### 6. Frontend Deployment (VerseOne)

- [ ] Update `.env.production`:

```env
VITE_APP_ENV=production
VITE_API_URL=https://your-app-service.azurewebsites.net/api
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_REDIRECT_URI=https://your-verseone-url
VITE_ENABLE_TEST_BUTTONS=false
VITE_ENABLE_MOCK_AUTH=false
```

- [ ] **NEW:** Add CSRF token integration to frontend:
  - [ ] Fetch CSRF token on app load from `/api/csrf-token`
  - [ ] Include `CSRF-Token` header in all POST/PUT/DELETE requests
  - [ ] Refresh token if 403 Forbidden received

Example frontend code:
```javascript
// On app load
const { csrfToken } = await fetch('/api/csrf-token').then(r => r.json());

// Include in requests
headers: {
  'Content-Type': 'application/json',
  'CSRF-Token': csrfToken
}
```

- [ ] Build production bundle: `npm run build`
- [ ] Deploy `dist` folder to VerseOne
- [ ] Configure routing for SPA

### 7. Power Automate Flows (Notifications via SharePoint triggers)

For DLP compliance, use SharePoint list triggers instead of HTTP triggers:

- [ ] Flow 1: New Submission Notification
  - Trigger: When item created in Submissions (SharePoint list)
  - Action: Send email to PBP panel

- [ ] Flow 2: Status Change Notifications
  - Trigger: When item modified in Submissions
  - Action: Send appropriate emails based on status

- [ ] Flow 3: Daily Reminder
  - Trigger: Scheduled (daily at 9am)
  - Action: Send reminders for pending reviews > 2 days

### 8. Document Governance Verification

**CRITICAL - Sensitive Document Protection:**

- [ ] Verify passport/driving licence uploads go to `SensitiveDocuments` library
- [ ] Verify `isSensitive` flag is set correctly in database
- [ ] Verify Alemba sync ONLY includes `allowAlembaSync=true` documents
- [ ] Test that sensitive documents cannot be retrieved via Alemba API

---

## Post-Deployment Testing

### Functional Tests

- [ ] Submit new request (Sections 1-2)
- [ ] PBP Panel can view and approve/reject
- [ ] Requester receives approval certificate
- [ ] Complete full form (Sections 3-7)
- [ ] Procurement review and routing works
- [ ] OPW Panel review (if applicable)
- [ ] Contract upload (if applicable)
- [ ] AP Control completion
- [ ] Final PDF generated with all signatures
- [ ] **NEW:** Update submission fields (bank details, addresses) - verify all fields update
- [ ] **NEW:** Check duplicate vendor detection - submit with existing company name/VAT

### Security Tests (February 2026 Updates)

**Authentication & Authorization:**
- [ ] Unauthenticated users cannot access review pages
- [ ] Users can only see submissions they have access to
- [ ] Role-based access control working correctly
- [ ] Session cookies are secure (httpOnly, sameSite: strict)

**CSRF Protection:**
- [ ] **NEW:** GET /api/csrf-token returns valid token
- [ ] **NEW:** POST without CSRF token is rejected (403 Forbidden)
- [ ] **NEW:** POST with invalid CSRF token is rejected (403 Forbidden)
- [ ] **NEW:** POST with valid CSRF token succeeds

**Server-Side Validation:**
- [ ] **NEW:** Submit form with invalid NHS email (not @nhs.net) via Postman - rejected
- [ ] **NEW:** Submit form with invalid CRN format - rejected
- [ ] **NEW:** Submit form with invalid VAT number - rejected
- [ ] **NEW:** Submit form with invalid phone number - rejected
- [ ] **NEW:** Submit form with missing required fields - rejected

**File Upload Security:**
- [ ] **NEW:** Upload .exe renamed to .pdf - rejected (magic number mismatch)
- [ ] **NEW:** Upload 15MB file - rejected (exceeds max size)
- [ ] **NEW:** Upload unsupported file type (.zip) - rejected
- [ ] **NEW:** Upload valid PDF - succeeds and goes to correct library

**Data Security:**
- [ ] Sensitive documents not exposed via API
- [ ] Passport/driving license uploads go to SensitiveDocuments library
- [ ] VAT certs/contracts go to SupplierDocuments library
- [ ] **NEW:** Document access logged to AuditTrail table
- [ ] Audit trail logging all actions

**SQL Injection & XSS:**
- [ ] **NEW:** Submit form with SQL injection attempt (`'; DROP TABLE--`) - blocked
- [ ] **NEW:** Submit form with XSS attempt (`<script>alert(1)</script>`) - sanitized

### Integration Tests

- [ ] SharePoint document upload working
- [ ] **NEW:** Health check reports database as "connected"
- [ ] **NEW:** Health check reports SharePoint as "connected"
- [ ] **NEW:** Health check returns HTTP 503 if DB down (test by stopping SQL Server)
- [ ] Companies House lookup working
- [ ] **NEW:** Duplicate vendor detection calls CheckDuplicateVendor stored procedure
- [ ] Email notifications sending
- [ ] PDF generation working

### Performance Tests

- [ ] API responds within 2 seconds for normal requests
- [ ] Document upload completes within 10 seconds
- [ ] Rate limiting prevents > 100 requests/minute per IP

---

## Rollback Plan

If issues occur:

1. **Frontend**: Revert to previous VerseOne deployment
2. **Backend**: Use Azure App Service deployment slots to swap back
3. **Database**: Restore from backup (Azure SQL automatic backups)

---

## Support Contacts

| Role | Contact |
|------|---------|
| Development | [Your team] |
| SharePoint Admin | [IT team] |
| Azure Admin | [IT team] |
| Alemba Integration | [TBC] |

---

## Files Not Needed in Production

The following files can be removed before final deployment:

- `Claude_Code_Production_Prompt.md` - Development instructions only
- `Production_Implementation_Guide_v3.md` - Development instructions only
- `RUNTIME_ERROR_ANALYSIS.md` - Debug notes (keep for reference if needed)
- Any `.test.js` files in production build

---

## Additional Resources

**For complete details on all fixes and implementation changes:**
See [CHANGES_IMPLEMENTED.md](../archive/CHANGES_IMPLEMENTED.md) - Comprehensive testing checklist, deployment steps, and beginner-friendly explanations.

**For deployment details:**
See [DEPLOYMENT.md](DEPLOYMENT.md) - Step-by-step deployment guide with updated security configurations.

**For beginner-friendly setup guides:**
See [setup/](setup/) folder for detailed setup instructions.

---

*Document maintained by: Development Team*
*Last updated: February 3, 2026*
*Version: 4.0 - Updated with security enhancements*
