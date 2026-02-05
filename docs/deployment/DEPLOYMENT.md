# NHS Supplier Setup Form - Deployment Guide

**Version:** 4.0
**Last Updated:** February 3, 2026
**For:** Barts Health NHS Trust

---

## ⚠️ IMPORTANT: Security Updates (February 2026)

This deployment guide has been updated to reflect critical security fixes implemented in February 2026:

- ✅ **CSRF Protection** - All state-changing operations require CSRF tokens
- ✅ **Server-Side Validation** - Express-validator middleware on all routes
- ✅ **Magic Number File Validation** - Prevents MIME type spoofing
- ✅ **SESSION_SECRET Enforcement** - No default value, must be generated
- ✅ **Environment Validation** - API fails fast if required variables missing
- ✅ **Enhanced Health Check** - Verifies database and SharePoint connectivity
- ✅ **SQL Injection Fixed** - All queries use proper parameterization
- ✅ **SharePoint Service Fixed** - Rewritten to use @pnp/sp correctly
- ✅ **Duplicate Vendor Detection** - Implemented using stored procedure
- ✅ **Document Access Audit** - All document access logged for compliance

**For complete details, see:** [CHANGES_IMPLEMENTED.md](../CHANGES_IMPLEMENTED.md)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Phase 1: Azure AD Setup](#3-phase-1-azure-ad-setup)
4. [Phase 2: SQL Server Database](#4-phase-2-sql-server-database)
5. [Phase 3: SharePoint Document Libraries](#5-phase-3-sharepoint-document-libraries)
6. [Phase 4: Backend API Deployment](#6-phase-4-backend-api-deployment)
7. [Phase 5: Frontend Deployment](#7-phase-5-frontend-deployment)
8. [Phase 6: Power Automate Notifications](#8-phase-6-power-automate-notifications)
9. [Testing](#9-testing)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │  VerseOne/WeShare │  (React Frontend)                                    │
│  │  Intranet Page    │                                                      │
│  └────────┬─────────┘                                                       │
│           │ Azure AD SSO                                                    │
│           ▼                                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │              EXPRESS.JS API (Azure App Service)                  │       │
│  │                                                                  │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │       │
│  │  │ Auth/RBAC   │  │ Submissions │  │ Documents   │               │       │
│  │  │ Middleware  │  │ Service     │  │ Service     │               │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│           │                │                │                               │
│           ▼                ▼                ▼                               │
│  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐                  │
│  │  SQL Server     │  │  SQL Server │  │  SharePoint     │                  │
│  │  (Auth/Audit)   │  │  (Data)     │  │  (Documents)    │                  │
│  └─────────────────┘  └─────────────┘  └────────┬────────┘                  │
│                                                 │                           │
│                                                 ▼                           │
│                              ┌─────────────────────────────────┐            │
│                              │       Power Automate            │            │
│                              │  (Notifications via SP triggers)│            │
│                              └─────────────────────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React + Vite | User interface (VerseOne hosted) |
| Backend API | Express.js (Node.js) | Business logic, authentication |
| Database | SQL Server | Submissions, audit trail |
| Documents | SharePoint | Document storage (2 libraries) |
| Auth | Azure AD | SSO + role-based access |
| Notifications | Power Automate | Email alerts via SharePoint triggers |

### Document Governance

**CRITICAL:** Sensitive documents must NEVER sync to Alemba.

| Library | Documents | Alemba Sync |
|---------|-----------|-------------|
| `SupplierDocuments` | Contracts, letterheads, PBP certificates | ✅ Allowed |
| `SensitiveDocuments` | Passports, driving licences | ❌ NEVER |

---

## 2. Prerequisites

### Software Requirements

- **Node.js** 18+ - [nodejs.org](https://nodejs.org/)
- **SQL Server** 2019+ or Azure SQL
- **Git** - For version control

### Access Requirements

- Azure Portal (App Registration)
- Azure AD Admin (Security Groups)
- SharePoint Admin (Document Libraries)
- SQL Server Admin (Database creation)

---

## 3. Phase 1: Azure AD Setup

### 3.1 Create App Registration

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory
2. Click **App registrations** → **New registration**
3. Configure:
   - Name: `NHS Supplier Setup Form`
   - Supported account types: **Single tenant**
   - Redirect URI: `https://your-verseone-url` (add later)
4. Click **Register**
5. Note down:
   - **Application (Client) ID**
   - **Directory (Tenant) ID**

### 3.2 Create Client Secret

1. In your App Registration → **Certificates & secrets**
2. Click **New client secret**
3. Description: `Backend API`
4. Expires: 24 months
5. **Copy the secret value immediately** (shown only once)

### 3.3 Configure API Permissions

1. Go to **API permissions** → **Add a permission**
2. Add:
   - Microsoft Graph → **User.Read** (Delegated)
   - Microsoft Graph → **GroupMember.Read.All** (Application)
3. Click **Grant admin consent**

### 3.4 Create Security Groups

Request IT to create these AD Security Groups:

| Group Name | Purpose | Initial Members |
|------------|---------|-----------------|
| `NHS-SupplierForm-PBP` | PBP Panel reviewers | [PBP Team] |
| `NHS-SupplierForm-Procurement` | Procurement reviewers | [Procurement Team] |
| `NHS-SupplierForm-OPW` | OPW/IR35 reviewers | [OPW Panel] |
| `NHS-SupplierForm-Contract` | Contract drafters | [Contract Team] |
| `NHS-SupplierForm-APControl` | AP Control team | [AP Team] |
| `NHS-SupplierForm-Admin` | System administrators | [IT Admin] |

---

## 4. Phase 2: SQL Server Database

### 4.1 Create Database

```sql
CREATE DATABASE NHSSupplierForms;
GO
USE NHSSupplierForms;
GO
```

### 4.2 Run Schema Script

Execute the schema file: `supplier-form-api/database/schema.sql`

This creates:
- `Submissions` - Main form data
- `SubmissionDocuments` - Document metadata with governance flags
- `AuditTrail` - Compliance logging
- `VendorsReference` - Duplicate detection
- `NotificationQueue` - Power Automate triggers

### 4.3 Create API User

```sql
CREATE LOGIN SupplierFormAPI WITH PASSWORD = 'YourSecurePassword';
CREATE USER SupplierFormAPI FOR LOGIN SupplierFormAPI;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON Submissions TO SupplierFormAPI;
GRANT SELECT, INSERT, UPDATE, DELETE ON SubmissionDocuments TO SupplierFormAPI;
GRANT SELECT, INSERT ON AuditTrail TO SupplierFormAPI;
GRANT SELECT ON VendorsReference TO SupplierFormAPI;
GRANT SELECT, INSERT, UPDATE ON NotificationQueue TO SupplierFormAPI;
GRANT EXECUTE ON SCHEMA::dbo TO SupplierFormAPI;
```

---

## 5. Phase 3: SharePoint Document Libraries

### 5.1 Create SharePoint Site

1. Go to SharePoint Admin Center
2. Create **Team Site**: `NHS-Supplier-Forms`
3. Set to **Private**

### 5.2 Create Document Libraries

#### Library 1: SupplierDocuments (Business documents)

1. Click **New** → **Document library**
2. Name: `SupplierDocuments`
3. Create folders:
   - `/Letterheads/`
   - `/Contracts/`
   - `/PBP_Certificates/`
   - `/Other/` (for PBP-requester additional documentation)

#### Library 2: SensitiveDocuments (ID documents)

1. Click **New** → **Document library**
2. Name: `SensitiveDocuments`
3. Create folders:
   - `/Passports/`
   - `/DrivingLicences/`
   - `/IDDocuments/`

### 5.3 Configure Permissions

| Library | Access |
|---------|--------|
| SupplierDocuments | All reviewer groups |
| SensitiveDocuments | AP Control + Admin only |

---

## 6. Phase 4: Backend API Deployment

### 6.1 Configure Environment Variables

**⚠️ CRITICAL:** The API will NOT start if any required variables are missing. Environment validation runs on startup.

#### Quick Reference: What Needs Replacing

| Variable | Current Value | Action Required | Priority |
|----------|---------------|-----------------|----------|
| **Azure AD Configuration** | | | |
| `AZURE_AD_CLIENT_ID` | `00000000-0000-0000-0000-000000000000` | ⚠️ Replace with your Azure AD App Registration Client ID | 🔴 REQUIRED |
| `AZURE_AD_CLIENT_SECRET` | `placeholder_secret` | ⚠️ Replace with your Azure AD App Registration Secret | 🔴 REQUIRED |
| `AZURE_AD_TENANT_ID` | `00000000-0000-0000-0000-000000000000` | ⚠️ Replace with your NHS Tenant ID | 🔴 REQUIRED |
| **Database Configuration** | | | |
| `DB_HOST` | `localhost` | ⚠️ Replace with SQL Server hostname (e.g., `sqlserver.bartshealth.nhs.uk`) | 🔴 REQUIRED |
| `DB_NAME` | `SupplierSetupDB` | ✅ Keep as-is (matches database name) | 🟢 OK |
| `DB_USER` | `dev_user` | ⚠️ Replace with SQL Server username (e.g., `SupplierFormAPI`) | 🔴 REQUIRED |
| `DB_PASSWORD` | `dev_password_placeholder` | ⚠️ Replace with SQL Server password | 🔴 REQUIRED |
| `DB_PORT` | `1433` | ✅ Keep as-is (standard SQL Server port) | 🟢 OK |
| `DB_TRUSTED_CONNECTION` | `false` | ⚠️ Set to `true` if using Windows Authentication | 🟡 OPTIONAL |
| **SharePoint Configuration** | | | |
| `SP_SITE_URL` | `https://placeholder.sharepoint.com` | ⚠️ Replace with actual SharePoint site (e.g., `https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms`) | 🔴 REQUIRED |
| `SP_CLIENT_ID` | `00000000-0000-0000-0000-000000000000` | ⚠️ Replace with SharePoint App Registration Client ID | 🔴 REQUIRED |
| `SP_CLIENT_SECRET` | `placeholder_secret` | ⚠️ Replace with SharePoint App Registration Secret | 🔴 REQUIRED |
| `SP_TENANT_ID` | `00000000-0000-0000-0000-000000000000` | ⚠️ Replace with your NHS Tenant ID (same as Azure AD) | 🔴 REQUIRED |
| **Security** | | | |
| `SESSION_SECRET` | `dev-secret-temp-replace-in-production-12345678901234567890` | ⚠️ **CRITICAL:** Generate random 32+ character string | 🔴 REQUIRED |
| **Companies House API** | | | |
| `CH_API_KEY` | `d1e356cc-2181-4704-ad76-d2784ca5c917` | ✅ **CONFIGURED** - Your API key is already set | 🟢 OK |
| `CH_API_URL` | `https://api.company-information.service.gov.uk` | ✅ Keep as-is (official Companies House API) | 🟢 OK |
| **Application Settings** | | | |
| `NODE_ENV` | `development` | ⚠️ Change to `production` for deployment | 🔴 REQUIRED |
| `API_PORT` | `3001` | ✅ Keep as-is (or change if port conflict) | 🟢 OK |
| `CORS_ORIGIN` | `http://localhost:5173` | ⚠️ Change to production URL (e.g., `https://weshare.bartshealth.nhs.uk`) | 🔴 REQUIRED |

---

#### Full `.env` Configuration Template

Create `.env` on the server (or configure in Azure App Service). Replace all values marked with ⚠️ below:

```env
# ===========================================
# NHS Supplier Setup Form API - PRODUCTION Configuration
# Last Updated: February 4, 2026
# ===========================================

# ===========================================
# AZURE AD AUTHENTICATION (REQUIRED)
# ===========================================
# ⚠️ Replace with your Azure AD App Registration details
# Get these from: Azure Portal → Azure Active Directory → App Registrations
AZURE_AD_TENANT_ID=<YOUR_NHS_TENANT_ID>                    # ⚠️ REPLACE THIS
AZURE_AD_CLIENT_ID=<YOUR_APP_REGISTRATION_CLIENT_ID>       # ⚠️ REPLACE THIS
AZURE_AD_CLIENT_SECRET=<YOUR_APP_REGISTRATION_SECRET>      # ⚠️ REPLACE THIS

# ===========================================
# DATABASE CONFIGURATION (REQUIRED)
# ===========================================
# ⚠️ Replace with your SQL Server connection details
DB_HOST=<YOUR_SQL_SERVER_HOSTNAME>                         # ⚠️ REPLACE THIS (e.g., sqlserver.bartshealth.nhs.uk)
DB_PORT=1433                                               # ✅ Keep as-is
DB_NAME=SupplierSetupDB                                    # ✅ Keep as-is (matches database name)
DB_USER=<YOUR_SQL_USERNAME>                                # ⚠️ REPLACE THIS (e.g., SupplierFormAPI)
DB_PASSWORD=<YOUR_SQL_PASSWORD>                            # ⚠️ REPLACE THIS (use secure password)
DB_TRUSTED_CONNECTION=false                                # ⚠️ Set to true if using Windows Auth

# ===========================================
# SHAREPOINT CONFIGURATION (REQUIRED)
# ===========================================
# ⚠️ Replace with your SharePoint site and app registration
SP_SITE_URL=<YOUR_SHAREPOINT_SITE_URL>                     # ⚠️ REPLACE THIS (e.g., https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms)
SP_CLIENT_ID=<YOUR_SHAREPOINT_APP_CLIENT_ID>               # ⚠️ REPLACE THIS
SP_CLIENT_SECRET=<YOUR_SHAREPOINT_APP_SECRET>              # ⚠️ REPLACE THIS
SP_TENANT_ID=<YOUR_NHS_TENANT_ID>                          # ⚠️ REPLACE THIS (same as AZURE_AD_TENANT_ID)
SP_DOCS_LIBRARY=SupplierDocuments                          # ✅ Keep as-is
SP_SENSITIVE_DOCS_LIBRARY=SensitiveDocuments               # ✅ Keep as-is
SP_STATUS_LIST=SubmissionStatus                            # ✅ Keep as-is

# ===========================================
# SESSION SECRET (REQUIRED - MUST GENERATE)
# ===========================================
# ⚠️ CRITICAL: Generate a random 32+ character string
# DO NOT use the development value in production!
#
# Generate using one of these methods:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#   openssl rand -hex 32
#   PowerShell: -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
SESSION_SECRET=<GENERATE_RANDOM_32_CHAR_STRING>            # ⚠️ REPLACE THIS - NEVER use default!

# ===========================================
# COMPANIES HOUSE API (CONFIGURED)
# ===========================================
# ✅ Your API key is already configured and working
CH_API_KEY=d1e356cc-2181-4704-ad76-d2784ca5c917            # ✅ ALREADY CONFIGURED
CH_API_URL=https://api.company-information.service.gov.uk  # ✅ Keep as-is

# ===========================================
# SERVER CONFIGURATION
# ===========================================
NODE_ENV=production                                         # ⚠️ Change from 'development' to 'production'
API_PORT=3001                                              # ✅ Keep as-is (or change if port conflict)
CORS_ORIGIN=<YOUR_FRONTEND_URL>                            # ⚠️ REPLACE THIS (e.g., https://weshare.bartshealth.nhs.uk)

# ===========================================
# SECURITY SETTINGS
# ===========================================
RATE_LIMIT_MAX=100                                         # ✅ Keep as-is (100 requests/minute per IP)
MAX_FILE_SIZE=10485760                                     # ✅ Keep as-is (10MB file upload limit)
ALLOWED_FILE_TYPES=.pdf,.png,.jpg,.jpeg,.doc,.docx         # ✅ Keep as-is

# ===========================================
# LOGGING
# ===========================================
LOG_LEVEL=info                                             # ✅ Keep as-is (or use 'debug' for troubleshooting)
LOG_FILE_PATH=./logs/app.log                               # ✅ Keep as-is

# ===========================================
# ALEMBA INTEGRATION (OPTIONAL - Configure later if needed)
# ===========================================
# ALEMBA_API_URL=https://servicedeskbartshealth.alembacloud.com/api
# ALEMBA_API_KEY=<your_alemba_api_key>
# ALEMBA_CLOSURE_STATUS=Closed
# ALEMBA_RESOLUTION_CODE=Resolved

# ===========================================
# NOTIFICATIONS (OPTIONAL - Configure later if needed)
# ===========================================
# PA_NOTIFICATION_WEBHOOK=<power_automate_webhook_url>
```

---

#### Development vs Production Configuration

**For Development (Current `.env`):**
- ✅ Companies House API key configured
- ✅ Placeholder values for database/SharePoint (allows server to start)
- ✅ `NODE_ENV=development` (bypasses DB/SharePoint requirements)
- ✅ Authentication optional for testing

**For Production Deployment:**
- 🔴 Replace ALL placeholder values marked with ⚠️
- 🔴 Set `NODE_ENV=production`
- 🔴 Generate new `SESSION_SECRET`
- 🔴 Update `CORS_ORIGIN` to production URL
- 🔴 Configure real database and SharePoint connections

**Generate SESSION_SECRET:**

**Option 1: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: PowerShell (Windows)**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### 6.2 Install Dependencies

**IMPORTANT:** New dependencies added for security features.

```bash
# In supplier-form-api folder
npm install
```

This installs:
- `express-session` - Session management
- `csurf` - CSRF protection
- `cookie-parser` - Cookie parsing for CSRF
- `express-validator` - Server-side validation

### 6.3 Deploy to Azure App Service

```bash
# In supplier-form-api folder
npm start

# Or deploy via Azure CLI
az webapp up --name nhs-supplier-api --resource-group your-rg
```

### 6.4 Test API Health Check

The health check now verifies database and SharePoint connectivity:

```bash
curl https://your-api.azurewebsites.net/health
```

**Expected Response (Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-03T10:30:00.000Z",
  "environment": "production",
  "checks": {
    "database": "connected",
    "sharepoint": "connected"
  }
}
```

**Response if Dependencies Down (HTTP 503):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-02-03T10:30:00.000Z",
  "environment": "production",
  "checks": {
    "database": "error: Connection timeout",
    "sharepoint": "connected"
  }
}
```

### 6.5 Get CSRF Token

Frontend must obtain CSRF token before making POST/PUT/DELETE requests:

```bash
curl https://your-api.azurewebsites.net/api/csrf-token
# Returns: {"csrfToken":"abc123..."}
```

**Frontend Integration:**
```javascript
// 1. Get CSRF token on app load
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// 2. Include in all POST/PUT/DELETE requests
fetch('/api/submissions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken
  },
  body: JSON.stringify(formData)
});
```

---

## 7. Phase 5: Frontend Deployment

### 7.1 Configure Environment

Edit `.env.production`:

```env
VITE_APP_ENV=production
VITE_API_URL=https://your-api.azurewebsites.net/api
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_REDIRECT_URI=https://your-verseone-url
VITE_ENABLE_TEST_BUTTONS=false
VITE_ENABLE_MOCK_AUTH=false
```

### 7.2 Build for Production

```bash
npm install
npm run build
```

### 7.3 Deploy to VerseOne

1. Upload contents of `dist/` folder to VerseOne
2. Configure routing to serve `index.html` for all routes

---

## 8. Phase 6: Power Automate Notifications

For DLP compliance, use **SharePoint list triggers** (not HTTP triggers).

### 8.1 Notification Flow: New Submission

**Trigger:** When item created in `NotificationQueue` (SQL → SharePoint sync)

**Actions:**
1. Get submission details
2. Send email to appropriate team
3. Mark notification as processed

### 8.2 Notification Flow: Status Changes

**Trigger:** When item modified in Submissions list

**Condition:** Status changed

**Actions:**
1. Determine notification type
2. Send email to requester/reviewer
3. Log to audit trail

### 8.3 Daily Reminder Flow

**Trigger:** Recurrence (Daily at 9:00 AM)

**Actions:**
1. Get submissions pending > 2 days
2. Send reminder emails to reviewers

---

## 9. Testing

### Pre-Go-Live Checklist

**Authentication & Authorization:**
- [ ] Azure AD authentication working
- [ ] All 6 security groups can access their respective pages
- [ ] Users cannot access unauthorized pages (403 Forbidden)
- [ ] Session cookies are secure (httpOnly, sameSite: strict)

**Database & Data:**
- [ ] SQL database accepting connections
- [ ] Health check reports database as "connected"
- [ ] Duplicate vendor detection working (calls CheckDuplicateVendor stored procedure)
- [ ] All submission fields can be updated (not just status/currentStage)

**SharePoint & Documents:**
- [ ] SharePoint document upload working
- [ ] Health check reports SharePoint as "connected"
- [ ] Sensitive documents (passports, IDs) going to SensitiveDocuments library
- [ ] Business documents (letterheads, contracts) going to SupplierDocuments library
- [ ] Document access audit logging to AuditTrail table

**Security Features:**
- [ ] CSRF token endpoint returns valid token
- [ ] POST/PUT/DELETE requests without CSRF token are rejected (403)
- [ ] Server-side validation rejects invalid data (test with Postman)
- [ ] File upload rejects spoofed MIME types (test .exe renamed to .pdf)
- [ ] File upload rejects oversized files (>10MB)
- [ ] SQL injection attempts blocked by parameterized queries

**Notifications & Audit:**
- [ ] Email notifications sending via Power Automate
- [ ] Audit trail logging all actions
- [ ] Document access logged when documents are viewed

### Test Scenarios

**Note:** PBP reviews the QUESTIONNAIRE (pre-submission), not the full form. Procurement is the first stage after form submission.

#### Functional Tests

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Questionnaire to PBP | Q2.7="No", fill questionnaire, submit | Questionnaire created, PBP notified |
| PBP Questionnaire Approval | Open PBP page, approve questionnaire | Certificate issued, requester notified |
| Submit full form | Complete all sections, submit in Section 7 | Submission created, PROCUREMENT notified (not PBP) |
| Procurement Standard | Open Procurement page, classify as Standard | Routed to AP Control |
| Procurement OPW | Open Procurement page, classify as Potential OPW | Routed to OPW Panel |
| Unauthorized access | Open procurement page without role | Access denied page shown |
| Document upload (passport) | Upload passport in Section 3 | Goes to SensitiveDocuments library |
| AP Control verification | Verify bank and company details | Supplier created, requester notified with vendor number |
| Update submission fields | Update bank details, address, contact info | All fields updated successfully |
| Duplicate vendor check | Submit form with existing company name/VAT | Warning shown about potential duplicate |

#### Security Tests

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| CSRF protection | POST to /api/submissions without CSRF token | HTTP 403 Forbidden |
| Server-side validation | POST invalid email (not @nhs.net) via Postman | HTTP 400 with validation error |
| File type spoofing | Rename .exe to .pdf and upload | HTTP 400 - Magic number mismatch detected |
| Oversized file | Upload 15MB file | HTTP 400 - File too large |
| SQL injection attempt | Submit form with `'; DROP TABLE--` in field | Blocked by parameterized queries |
| XSS attempt | Submit form with `<script>alert(1)</script>` | HTML tags stripped by sanitization |
| Invalid submission ID | GET /api/submissions/INVALID-ID | HTTP 400 - Invalid format |
| Document access audit | View any document | Entry created in AuditTrail table |

---

## 10. Troubleshooting

### Common Issues

#### "API won't start" or "Missing required environment variables"
- **Cause:** Required environment variables not set
- **Fix:** Ensure all REQUIRED variables are in .env file:
  - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `AZURE_AD_CLIENT_ID`, `AZURE_AD_TENANT_ID`
  - `SP_SITE_URL`, `SP_CLIENT_ID`, `SP_CLIENT_SECRET`
  - `SESSION_SECRET` (must be generated, no default)
- **Check:** Look for error message in logs: "Missing required environment variables"

#### "403 Forbidden" on POST/PUT/DELETE requests
- **Cause:** Missing CSRF token
- **Fix:** Frontend must obtain CSRF token from `/api/csrf-token` endpoint
- **Frontend Code:**
  ```javascript
  const { csrfToken } = await fetch('/api/csrf-token').then(r => r.json());
  headers: { 'CSRF-Token': csrfToken }
  ```

#### "401 Unauthorized" on API calls
- Check Azure AD token is valid
- Verify Client ID matches
- Check user is in required security group

#### "400 Bad Request - Validation Error"
- **Cause:** Server-side validation rejected input
- **Fix:** Check error details in response
- **Common Issues:**
  - NHS email must end with @nhs.net
  - CRN must be 8 digits
  - VAT number must be UK format (GB + 9-12 digits)
  - Phone number must be valid UK format

#### Documents not uploading
- Check SharePoint permissions
- Verify SP_CLIENT_ID has Sites.FullControl.All
- Check folder structure exists in SharePoint
- **New:** Check file type validation - ensure file content matches declared MIME type

#### "Health check shows unhealthy"
- **Cause:** Database or SharePoint connection failed
- **Fix:** Check health check response for specific error
- **Database Issues:** Verify DB credentials, firewall rules, connection string
- **SharePoint Issues:** Verify SP credentials, site URL, permissions

#### Notifications not sending
- Check Power Automate flow is enabled
- Verify SharePoint trigger is configured
- Check email addresses are valid

#### "File upload rejected - invalid file type"
- **Cause:** Magic number validation detected MIME spoofing
- **Fix:** Ensure file content matches declared type (e.g., PDF must start with %PDF)
- **Common Issue:** Renaming .exe to .pdf will be detected and rejected

### Support Contacts

| Issue | Contact |
|-------|---------|
| Azure AD | IT Service Desk |
| SharePoint | SharePoint Admin |
| Database | Database Admin |
| Application | Development Team |

---

## Quick Reference

### API Endpoints

| Endpoint | Method | Description | Auth Required | CSRF Required |
|----------|--------|-------------|---------------|---------------|
| `/health` | GET | Health check (DB + SharePoint) | No | No |
| `/api/csrf-token` | GET | Get CSRF token for state-changing ops | No | No |
| `/api/session` | GET | Get current user info | Yes | No |
| `/api/submissions` | POST | Create submission | Yes | Yes |
| `/api/submissions/:id` | GET | Get submission details | Yes | No |
| `/api/submissions/:id` | PUT | Update submission | Yes | Yes |
| `/api/reviews/:stage/queue` | GET | Get work queue for stage | Yes | No |
| `/api/documents/:submissionId` | POST | Upload document (with validation) | Yes | Yes |
| `/api/vendors/check` | GET | Check for duplicate vendors | Yes | No |
| `/api/companies-house/:crn` | GET | Lookup company by CRN | Yes | No |

**Notes:**
- All POST/PUT/DELETE requests require CSRF token in `CSRF-Token` header
- File uploads validated using magic numbers (prevents MIME spoofing)
- Server-side validation on all POST/PUT routes

### Environment Files

| File | Purpose |
|------|---------|
| `.env.local` | Local development |
| `.env.production` | Production build |
| `supplier-form-api/.env` | Backend API config |

---

## Additional Resources

**For complete details on security fixes and implementation changes:**
See [CHANGES_IMPLEMENTED.md](../CHANGES_IMPLEMENTED.md) - Comprehensive summary of all fixes, testing checklist, and beginner-friendly explanations.

**For beginner-friendly setup guides:**
See [next-steps/](../next-steps/) folder for step-by-step instructions on database setup, SharePoint configuration, and Power Automate flows.

---

*Document maintained by: Development Team*
*Last updated: February 3, 2026*
*Version: 4.0 - Updated with security enhancements*
