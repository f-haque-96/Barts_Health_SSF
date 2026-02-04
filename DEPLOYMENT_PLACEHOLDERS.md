# Production Deployment - Placeholder Reference

**Last Updated:** February 4, 2026
**For:** Barts Health NHS Trust - Supplier Setup Form

---

## Quick Summary

This document lists **ALL placeholders** that must be replaced before production deployment of the backend API.

### Current Status

✅ **Development Mode Ready:**
- Companies House API configured and working
- CRN verification functional
- Backend can start without database/SharePoint
- Authentication optional for testing

🔴 **Production Deployment Required Actions:**
- Replace 15 placeholder values in `.env`
- Generate secure `SESSION_SECRET`
- Configure Azure AD App Registration
- Set up SQL Server database
- Configure SharePoint document libraries
- Update CORS origin to production URL

---

## Environment Variables That MUST Be Replaced

### 🔴 CRITICAL - Azure AD Authentication (3 variables)

These control user authentication and must match your Azure AD App Registration:

| Variable | Current Value | Replace With | How to Get |
|----------|---------------|--------------|------------|
| `AZURE_AD_TENANT_ID` | `00000000-0000-0000-0000-000000000000` | Your NHS Tenant ID | Azure Portal → Azure Active Directory → Overview → Tenant ID |
| `AZURE_AD_CLIENT_ID` | `00000000-0000-0000-0000-000000000000` | Your App Registration Client ID | Azure Portal → App Registrations → Your App → Application (client) ID |
| `AZURE_AD_CLIENT_SECRET` | `placeholder_secret` | Your App Registration Secret | Azure Portal → App Registrations → Your App → Certificates & secrets → New client secret |

**Why Critical:** Without these, user authentication will fail completely. All users will be blocked from accessing the system.

---

### 🔴 CRITICAL - Database Configuration (4 variables)

These control access to the SQL Server database where submissions are stored:

| Variable | Current Value | Replace With | How to Get |
|----------|---------------|--------------|------------|
| `DB_HOST` | `localhost` | Your SQL Server hostname | e.g., `sqlserver.bartshealth.nhs.uk` or `10.x.x.x` |
| `DB_USER` | `dev_user` | SQL Server username | Created during SQL Server setup (e.g., `SupplierFormAPI`) |
| `DB_PASSWORD` | `dev_password_placeholder` | SQL Server password | Set during SQL Server user creation |
| `DB_TRUSTED_CONNECTION` | `false` | `true` if using Windows Auth | Set to `true` if server is domain-joined and using integrated auth |

**Database Name:** `DB_NAME=SupplierSetupDB` ✅ **Keep as-is** (this matches the database schema)

**Why Critical:** Without correct database credentials, the API cannot:
- Store submission data
- Log audit trails
- Retrieve submissions for review
- Check for duplicate vendors

---

### 🔴 CRITICAL - SharePoint Configuration (4 variables)

These control document storage for uploaded files:

| Variable | Current Value | Replace With | How to Get |
|----------|---------------|--------------|------------|
| `SP_SITE_URL` | `https://placeholder.sharepoint.com` | Your SharePoint site URL | e.g., `https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms` |
| `SP_CLIENT_ID` | `00000000-0000-0000-0000-000000000000` | SharePoint App Client ID | Azure Portal → App Registrations → SharePoint App → Application ID |
| `SP_CLIENT_SECRET` | `placeholder_secret` | SharePoint App Secret | Azure Portal → App Registrations → SharePoint App → Certificates & secrets |
| `SP_TENANT_ID` | `00000000-0000-0000-0000-000000000000` | Your NHS Tenant ID | Same as `AZURE_AD_TENANT_ID` |

**Why Critical:** Without these, the API cannot:
- Upload supplier documents (contracts, letterheads)
- Store sensitive documents (passports, driving licences)
- Retrieve documents for review
- **This breaks the entire document workflow**

---

### 🔴 CRITICAL - Session Secret (1 variable)

This secures session cookies and CSRF tokens:

| Variable | Current Value | Replace With | How to Generate |
|----------|---------------|--------------|-----------------|
| `SESSION_SECRET` | `dev-secret-temp-replace-in-production-12345678901234567890` | Random 32+ character string | See generation methods below |

**How to Generate:**

**Option 1 (Node.js):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2 (OpenSSL):**
```bash
openssl rand -hex 32
```

**Option 3 (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Why Critical:**
- Using the development secret in production is a **major security vulnerability**
- Attackers can forge session cookies and bypass authentication
- CSRF tokens become predictable

---

### 🔴 CRITICAL - Application Settings (2 variables)

| Variable | Current Value | Replace With | Why |
|----------|---------------|--------------|-----|
| `NODE_ENV` | `development` | `production` | Enables production security features, disables dev bypasses |
| `CORS_ORIGIN` | `http://localhost:5173` | `https://weshare.bartshealth.nhs.uk` | Allows frontend to connect to API |

**Why Critical:**
- `NODE_ENV=development` allows API to start without database/SharePoint (testing only!)
- In production, you MUST set `NODE_ENV=production` to require all services
- Wrong `CORS_ORIGIN` blocks frontend from making API requests

---

## ✅ Variables That Are Already Configured

These do NOT need to be changed:

| Variable | Current Value | Status |
|----------|---------------|--------|
| `CH_API_KEY` | `d1e356cc-2181-4704-ad76-d2784ca5c917` | ✅ Your Companies House API key is configured and working |
| `CH_API_URL` | `https://api.company-information.service.gov.uk` | ✅ Official Companies House endpoint |
| `API_PORT` | `3001` | ✅ Standard port (change only if port conflict) |
| `DB_PORT` | `1433` | ✅ Standard SQL Server port |
| `DB_NAME` | `SupplierSetupDB` | ✅ Matches database schema name |
| `RATE_LIMIT_MAX` | `100` | ✅ 100 requests/minute per IP |
| `MAX_FILE_SIZE` | `10485760` | ✅ 10MB file upload limit |
| `LOG_LEVEL` | `info` | ✅ Appropriate for production |

---

## Complete Production `.env` Template

Here's the complete `.env` file with clear markers for what needs replacing:

```env
# ===========================================
# AZURE AD AUTHENTICATION (REQUIRED)
# ===========================================
AZURE_AD_TENANT_ID=<REPLACE_WITH_YOUR_TENANT_ID>              # ⚠️ REPLACE
AZURE_AD_CLIENT_ID=<REPLACE_WITH_YOUR_CLIENT_ID>              # ⚠️ REPLACE
AZURE_AD_CLIENT_SECRET=<REPLACE_WITH_YOUR_CLIENT_SECRET>      # ⚠️ REPLACE

# ===========================================
# DATABASE CONFIGURATION (REQUIRED)
# ===========================================
DB_HOST=<REPLACE_WITH_SQL_SERVER_HOSTNAME>                    # ⚠️ REPLACE
DB_PORT=1433                                                  # ✅ Keep as-is
DB_NAME=SupplierSetupDB                                       # ✅ Keep as-is
DB_USER=<REPLACE_WITH_SQL_USERNAME>                           # ⚠️ REPLACE
DB_PASSWORD=<REPLACE_WITH_SQL_PASSWORD>                       # ⚠️ REPLACE
DB_TRUSTED_CONNECTION=false                                   # ⚠️ Set to true if using Windows Auth

# ===========================================
# SHAREPOINT CONFIGURATION (REQUIRED)
# ===========================================
SP_SITE_URL=<REPLACE_WITH_SHAREPOINT_SITE_URL>                # ⚠️ REPLACE
SP_CLIENT_ID=<REPLACE_WITH_SHAREPOINT_CLIENT_ID>              # ⚠️ REPLACE
SP_CLIENT_SECRET=<REPLACE_WITH_SHAREPOINT_SECRET>             # ⚠️ REPLACE
SP_TENANT_ID=<REPLACE_WITH_YOUR_TENANT_ID>                    # ⚠️ REPLACE (same as AZURE_AD_TENANT_ID)
SP_DOCS_LIBRARY=SupplierDocuments                             # ✅ Keep as-is
SP_SENSITIVE_DOCS_LIBRARY=SensitiveDocuments                  # ✅ Keep as-is

# ===========================================
# SESSION SECRET (CRITICAL)
# ===========================================
SESSION_SECRET=<GENERATE_RANDOM_32_CHAR_STRING>               # ⚠️ GENERATE NEW!

# ===========================================
# COMPANIES HOUSE API (CONFIGURED)
# ===========================================
CH_API_KEY=d1e356cc-2181-4704-ad76-d2784ca5c917               # ✅ Already configured
CH_API_URL=https://api.company-information.service.gov.uk     # ✅ Keep as-is

# ===========================================
# APPLICATION SETTINGS
# ===========================================
NODE_ENV=production                                            # ⚠️ Change from 'development'
API_PORT=3001                                                 # ✅ Keep as-is
CORS_ORIGIN=<REPLACE_WITH_FRONTEND_URL>                       # ⚠️ REPLACE (e.g., https://weshare.bartshealth.nhs.uk)

# ===========================================
# SECURITY SETTINGS
# ===========================================
RATE_LIMIT_MAX=100                                            # ✅ Keep as-is
MAX_FILE_SIZE=10485760                                        # ✅ Keep as-is
ALLOWED_FILE_TYPES=.pdf,.png,.jpg,.jpeg,.doc,.docx            # ✅ Keep as-is

# ===========================================
# LOGGING
# ===========================================
LOG_LEVEL=info                                                # ✅ Keep as-is
LOG_FILE_PATH=./logs/app.log                                  # ✅ Keep as-is
```

---

## Deployment Checklist

### Before Production Deployment

- [ ] Replace all 15 placeholder values marked with ⚠️
- [ ] Generate new `SESSION_SECRET` (never use development value!)
- [ ] Set `NODE_ENV=production`
- [ ] Update `CORS_ORIGIN` to production frontend URL
- [ ] Verify Azure AD App Registration exists and has correct redirect URIs
- [ ] Verify SQL Server database is created with schema
- [ ] Verify SharePoint site and document libraries exist
- [ ] Test database connection from production server
- [ ] Test SharePoint connection from production server
- [ ] Enable SQL Server TDE (Transparent Data Encryption)
- [ ] Document backup retention policy

### After Deployment

- [ ] Test user authentication (Azure AD SSO)
- [ ] Test CRN verification
- [ ] Test form submission and database storage
- [ ] Test document upload to SharePoint
- [ ] Test role-based access control (all 6 roles)
- [ ] Verify audit trail logging
- [ ] Test Power Automate notifications
- [ ] Load testing (50-100 concurrent users)

---

## Development vs Production Summary

### Development (Current)
- ✅ CRN verification working
- ✅ Server starts without database/SharePoint
- ✅ Authentication optional
- ✅ Companies House API configured
- ⚠️ Placeholder values in `.env`

### Production (Required)
- 🔴 Replace 15 placeholder values
- 🔴 `NODE_ENV=production` (enforces all security)
- 🔴 Real database connection required
- 🔴 Real SharePoint connection required
- 🔴 Authentication enforced (no dev bypass)

---

## Need Help?

- **Full deployment guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Environment setup:** [supplier-form-api/.env.example](supplier-form-api/.env.example)
- **Database setup:** [next-steps/sql-server-setup.md](next-steps/sql-server-setup.md)
- **SharePoint setup:** [next-steps/sharepoint-setup.md](next-steps/sharepoint-setup.md)
- **Azure AD setup:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#phase-1-azure-ad-setup)

---

**Last Updated:** February 4, 2026
**Deployment Contact:** Barts Health NHS Trust - Procurement Team
