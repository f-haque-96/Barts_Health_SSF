# Next Steps - Setup Guides

## Your Action Items While Waiting for IT

These guides will walk you through the tasks you can complete **right now** without waiting for IT to set up Azure AD.

---

## Complete In This Order

| Step | Document | Time | What You'll Do |
|------|----------|------|----------------|
| **1** | [01-SQL-SERVER-SETUP.md](./01-SQL-SERVER-SETUP.md) | 30-45 min | Create the database and tables |
| **2** | [02-SHAREPOINT-LIBRARIES-SETUP.md](./02-SHAREPOINT-LIBRARIES-SETUP.md) | 20-30 min | Create document storage libraries |
| **3** | [03-SUPPLIER-DATA-EXPORT.md](./03-SUPPLIER-DATA-EXPORT.md) | 1-2 hours | Prepare existing supplier data |

---

## Progress Tracker

Use this to track your progress:

```
┌─────────────────────────────────────────────────────────────┐
│                    SETUP PROGRESS                            │
├─────────────────────────────────────────────────────────────┤
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
│      [ ] SupplierDocuments folders created (6)              │
│      [ ] SensitiveDocuments library created                 │
│      [ ] SensitiveDocuments folders created (4)             │
│      [ ] Permissions restricted on SensitiveDocuments       │
│                                                              │
│  [ ] Step 3: Supplier Data Export                           │
│      [ ] Data exported from finance system                  │
│      [ ] Columns renamed correctly                          │
│      [ ] VAT numbers formatted (GB prefix)                  │
│      [ ] Saved as CSV                                       │
│      [ ] Stored in supplier-form-api/data/                  │
│                                                              │
│  [ ] WAITING: Azure AD from IT                              │
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

Once you've completed all three steps AND received Azure AD details from IT:

1. Update the backend configuration with real values
2. Deploy the backend API
3. Update the frontend configuration
4. Deploy the frontend
5. Test end-to-end

Detailed deployment instructions are in: `docs/DEPLOYMENT.md`

---

*Created: January 2026*
*For: Barts Health NHS Trust - Supplier Setup Form Project*
