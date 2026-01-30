# NHS Supplier Setup Form - Production Deployment Checklist

**Version:** 3.0
**Last Updated:** January 2026
**For:** Barts Health NHS Trust

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
- [ ] Configure environment variables:

```env
# Azure AD
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# SQL Server
DB_SERVER=your-sql-server.database.windows.net
DB_DATABASE=NHSSupplierForms
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_ENCRYPT=true

# SharePoint
SP_TENANT_ID=your-tenant-id
SP_CLIENT_ID=sharepoint-app-client-id
SP_CLIENT_SECRET=sharepoint-app-secret
SP_SITE_URL=https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms

# Companies House API
CH_API_KEY=your-companies-house-api-key
CH_API_URL=https://api.company-information.service.gov.uk

# Application
NODE_ENV=production
PORT=3001
```

- [ ] Deploy backend code
- [ ] Test API endpoints
- [ ] Configure SSL certificate
- [ ] Set up Application Insights (optional)

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

### Security Tests

- [ ] Unauthenticated users cannot access review pages
- [ ] Users can only see submissions they have access to
- [ ] Role-based access control working correctly
- [ ] Sensitive documents not exposed via API
- [ ] Audit trail logging all actions

### Integration Tests

- [ ] SharePoint document upload working
- [ ] Companies House lookup working
- [ ] Email notifications sending
- [ ] PDF generation working

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

*Document maintained by: Development Team*
*Last updated: January 2026*
