# Next Steps - Setup Guides

## ⚠️ IMPORTANT: Security Updates (February 2026)

**The backend has been updated with critical security fixes.** These guides now include:
- SESSION_SECRET generation requirements (REQUIRED - no default)
- New environment variable validation (API fails on startup if missing)
- CSRF protection setup instructions
- Enhanced security configuration

**See [CHANGES_IMPLEMENTED.md](../CHANGES_IMPLEMENTED.md) for complete details of all fixes.**

---

## Your Action Items While Waiting for IT

These guides will walk you through the tasks you can complete **right now** without waiting for IT to set up Azure AD.

---

## Complete In This Order

### Do First (CRITICAL - Before Deployment)

| Step | Document | Time | What You'll Do |
|------|----------|------|----------------|
| **0** | [00-ENVIRONMENT-SETUP.md](./00-ENVIRONMENT-SETUP.md) | 15-20 min | **⚠️ NEW:** Generate SESSION_SECRET and understand environment variables (do this before deployment!) |

### Do Now (While Waiting for IT)

| Step | Document | Time | What You'll Do |
|------|----------|------|----------------|
| **1** | [01-SQL-SERVER-SETUP.md](./01-SQL-SERVER-SETUP.md) | 30-45 min | Create the database and tables |
| **2** | [02-SHAREPOINT-LIBRARIES-SETUP.md](./02-SHAREPOINT-LIBRARIES-SETUP.md) | 20-30 min | Create document storage libraries |

### Do After IT Responds (Requires Azure AD)

| Step | Document | Time | What You'll Do |
|------|----------|------|----------------|
| **4** | [04-POWER-AUTOMATE-SETUP.md](./04-POWER-AUTOMATE-SETUP.md) | 2-3 hours | Create notification email flows |

### Future Reference (Not Needed for Initial Launch)

| Step | Document | Time | What You'll Do |
|------|----------|------|----------------|
| **3** | [03-SUPPLIER-DATA-EXPORT.md](./03-SUPPLIER-DATA-EXPORT.md) | 1-2 hours | Prepare existing supplier data for duplicate detection |

---

## Progress Tracker

Use this to track your progress:

```
┌─────────────────────────────────────────────────────────────┐
│                    SETUP PROGRESS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ⚠️  DO FIRST (BEFORE DEPLOYMENT):                          │
│  ─────────────────────────────────                          │
│                                                              │
│  [ ] Step 0: Environment Variables Setup (NEW!)             │
│      [ ] Read the guide (00-ENVIRONMENT-SETUP.md)           │
│      [ ] SESSION_SECRET generated                           │
│      [ ] .env file created                                  │
│      [ ] All REQUIRED variables filled in                   │
│      [ ] API starts successfully (npm run dev)              │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  DO NOW (While Waiting for IT):                             │
│  ──────────────────────────────                             │
│                                                              │
│  [ ] Step 1: SQL Server Database                            │
│      [ ] SSMS installed                                      │
│      [ ] Connected to server                                 │
│      [ ] Database created                                    │
│      [ ] Schema script run                                   │
│      [ ] All 5 tables verified                              │
│                                                              │
│  [ ] Step 2: SharePoint Libraries                           │
│      [ ] Site created: NHS-Supplier-Forms                   │
│      [ ] SupplierDocuments library created                  │
│      [ ] SupplierDocuments folders created (4)              │
│      [ ] SensitiveDocuments library created                 │
│      [ ] SensitiveDocuments folders created (4)             │
│      [ ] NotificationQueue list created                     │
│      [ ] Permissions restricted on SensitiveDocuments       │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│  [ ] WAITING: Azure AD from IT                              │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  DO AFTER IT RESPONDS:                                      │
│  ─────────────────────                                      │
│                                                              │
│  [ ] Step 4: Power Automate Flows                           │
│      [ ] ProcessNotificationQueue flow created              │
│      [ ] DailyReminder flow created                         │
│      [ ] Test email received                                │
│      [ ] All flows turned ON                                │
│                                                              │
│  FUTURE (Not needed for launch):                            │
│  ───────────────────────────────                            │
│                                                              │
│  [ ] Step 3: Supplier Data Export (for duplicate detection) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## What's Blocked (Waiting for IT)

These tasks require Azure AD setup from IT:

| Task | Why It's Blocked |
|------|------------------|
| Backend API deployment | Needs Azure AD Client ID/Secret |
| Frontend deployment | Needs Azure AD for authentication |
| Power Automate flows | Can't test without full system |
| User acceptance testing | Need authentication working |

---

## Quick Reference

### Information You'll Collect

As you complete these guides, write down this information:

```
MY SETUP INFORMATION
====================

SQL SERVER:
- Server name: _______________________
- Database name: NHSSupplierForms
- API username: SupplierFormAPI
- API password: _______________________ (keep secure!)

SHAREPOINT:
- Site URL: https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms
- SupplierDocuments URL: [site]/SupplierDocuments
- SensitiveDocuments URL: [site]/SensitiveDocuments

SUPPLIER DATA:
- Number of suppliers exported: _______
- CSV file location: supplier-form-api/data/existing_suppliers.csv

AZURE AD (from IT - fill in when received):
- Client ID: _______________________
- Tenant ID: _______________________
- Client Secret: _______________________ (keep secure!)

⚠️ SESSION_SECRET (REQUIRED - GENERATE THIS):
- SESSION_SECRET: _______________________ (keep secure!)
- Generated using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
- OR: openssl rand -hex 32
```

---

## Need Help?

If you get stuck on any step:

1. **Re-read the guide** - every step is explained in detail
2. **Check the Troubleshooting section** at the end of each guide
3. **Google the exact error message** - many IT issues have solutions online
4. **Ask IT** - for server access, permissions, or connection issues
5. **Contact Finance** - for supplier data exports

---

## After Completing All Steps

Once you've completed all steps AND received Azure AD details from IT:

1. **Generate SESSION_SECRET** (REQUIRED - see DEPLOYMENT.md for 3 methods)
2. Update the backend configuration with real values (including SESSION_SECRET)
3. Install new dependencies: `npm install` (adds express-session, csurf, cookie-parser)
4. Deploy the backend API
5. Update the frontend configuration (add CSRF token integration)
6. Deploy the frontend
7. Test end-to-end (including security tests)

**CRITICAL:** The API will NOT start without SESSION_SECRET and other required variables.

Detailed deployment instructions are in: [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)

For complete list of fixes and testing checklist: [CHANGES_IMPLEMENTED.md](../CHANGES_IMPLEMENTED.md)

---

*Created: January 2026*
*Updated: February 3, 2026 - Added security requirements*
*For: Barts Health NHS Trust - Supplier Setup Form Project*
