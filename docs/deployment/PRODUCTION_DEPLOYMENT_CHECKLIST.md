# NHS Supplier Setup Smart Form - Production Deployment Checklist

**CRITICAL: This checklist MUST be completed before deploying to production**

Last Updated: February 4, 2026
Project: NHS Barts Health Supplier Setup Smart Form

---

## 🔴 CRITICAL PRE-DEPLOYMENT REQUIREMENTS

### 1. Environment Variables Configuration

#### Backend API (supplier-form-api/.env)

**Replace ALL placeholder values with actual production values:**

```bash
# Generate new SESSION_SECRET (REQUIRED)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] `SESSION_SECRET` - Generate using command above (NEVER use the dev default)
- [ ] `CORS_ORIGIN` - Set to actual frontend URL (e.g., `https://supplierform.bartshealth.nhs.uk`)
- [ ] `NODE_ENV=production` - MUST be set to "production"

**Database Configuration:**
- [ ] `DB_HOST` - SQL Server hostname
- [ ] `DB_NAME` - Database name (e.g., `NHSSupplierForms`)
- [ ] `DB_USER` - Database username
- [ ] `DB_PASSWORD` - Secure database password
- [ ] `DB_PORT` - Usually 1433 for SQL Server

**Azure AD Authentication:**
- [ ] `AZURE_AD_TENANT_ID` - Your Barts Health tenant ID
- [ ] `AZURE_AD_CLIENT_ID` - App registration client ID
- [ ] `AZURE_AD_CLIENT_SECRET` - App registration client secret

**SharePoint Configuration:**
- [ ] `SP_SITE_URL` - SharePoint site URL (e.g., `https://bartshealth.sharepoint.com/sites/SupplierForms`)
- [ ] `SP_CLIENT_ID` - SharePoint app registration client ID
- [ ] `SP_CLIENT_SECRET` - SharePoint app client secret
- [ ] `SP_TENANT_ID` - SharePoint tenant ID (same as Azure AD tenant ID)

**Companies House API:**
- [ ] `CH_API_KEY` - Companies House API key (register at https://developer.companieshouse.gov.uk)
- [ ] `CH_API_URL=https://api.company-information.service.gov.uk` - Leave as default

#### Frontend (.env.production)

- [ ] `VITE_API_URL` - Backend API URL (e.g., `https://api-supplierform.bartshealth.nhs.uk/api`)
- [ ] `VITE_AZURE_CLIENT_ID` - Same as backend AZURE_AD_CLIENT_ID
- [ ] `VITE_AZURE_TENANT_ID` - Same as backend AZURE_AD_TENANT_ID
- [ ] `VITE_AZURE_REDIRECT_URI` - Frontend URL for redirect after login
- [ ] `VITE_INTRANET_URL` - VerseOne intranet URL
- [ ] `VITE_APP_BASE_URL` - Frontend base URL

**Verify Feature Flags are DISABLED:**
- [ ] `VITE_ENABLE_TEST_BUTTONS=false`
- [ ] `VITE_ENABLE_DEBUG_LOGGING=false`
- [ ] `VITE_ENABLE_MOCK_AUTH=false`

---

## 🛠️ INFRASTRUCTURE SETUP

### 2. Azure AD Configuration

- [ ] App Registration created in Azure AD
- [ ] Redirect URIs configured for frontend URL
- [ ] API permissions granted (Application type, NOT Delegated):
  - [ ] Microsoft Graph - **User.Read.All** (Application) - for user profile resolution
  - [ ] Microsoft Graph - **GroupMember.Read.All** (Application) - for RBAC group checks
  - [ ] **Admin consent granted** for both permissions
- [ ] Client secret generated and stored securely

### 3. Azure AD Security Groups

**Create these EXACT security groups in Azure AD:**

- [ ] `NHS-SupplierForm-PBP` - PBP Panel members
- [ ] `NHS-SupplierForm-Procurement` - Procurement team
- [ ] `NHS-SupplierForm-OPW` - OPW Panel members
- [ ] `NHS-SupplierForm-Contract` - Contract Drafter team
- [ ] `NHS-SupplierForm-APControl` - AP Control team
- [ ] `NHS-SupplierForm-Admin` - System administrators

**Add users to appropriate groups before go-live**

### 4. SQL Server Database

- [ ] SQL Server instance provisioned (Azure SQL Database or on-premises)
- [ ] Database created with name matching `DB_NAME`
- [ ] Run database schema setup script: `supplier-form-api/database/schema.sql`
- [ ] Database user created with permissions:
  - [ ] SELECT, INSERT, UPDATE on all tables
  - [ ] EXECUTE on stored procedures
- [ ] **CRITICAL:** Enable Transparent Data Encryption (TDE):
  ```sql
  ALTER DATABASE NHSSupplierForms SET ENCRYPTION ON;
  ```
- [ ] Firewall rules configured to allow API server access
- [ ] Backup policy configured:
  - [ ] Daily full backups
  - [ ] Transaction log backups every 15 minutes
  - [ ] 30-day retention period

### 5. SharePoint Configuration

- [ ] SharePoint site created (e.g., `/sites/SupplierForms`)
- [ ] Document libraries created:
  - [ ] `SupplierDocuments` - For non-sensitive documents
  - [ ] `SensitiveDocuments` - For passports, ID documents (restricted access)
- [ ] Folder structure created in each library:
  ```
  SupplierDocuments/
  ├── Letterheads/
  ├── Contracts/
  ├── PBP_Certificates/
  └── Other/

  SensitiveDocuments/
  ├── Passports/
  ├── DrivingLicences/
  ├── IDDocuments/
  └── ProofOfAddress/
  ```
- [ ] Permissions configured:
  - [ ] `SensitiveDocuments` - AP Control and Admin only
  - [ ] `SupplierDocuments` - All authorized groups
- [ ] App registration created for SharePoint access
- [ ] API permissions granted for SharePoint

### 6. Antivirus Scanning

The backend implements fail-closed AV scanning on all file uploads. If no scanner is found in production, ALL file uploads will be rejected.

- [ ] **Windows Server:** Verify Windows Defender CLI is accessible from the Node.js process:
  ```bash
  # Test Windows Defender CLI
  "C:\Program Files\Windows Defender\MpCmdRun.exe" -Scan -ScanType 3 -File test.txt
  ```
- [ ] **Linux Server:** Install ClamAV:
  ```bash
  apt install clamav && freshclam
  ```
- [ ] Set `AV_SCANNER` environment variable if needed:
  - `defender` - Force Windows Defender
  - `clamav` - Force ClamAV
  - `none` - Disable AV scanning (NOT recommended for production)
  - Leave unset for auto-detection (recommended)
- [ ] Test: Upload a file via the form and verify AV scan completes in server logs
- [ ] Verify the EICAR test file is correctly blocked:
  ```bash
  # Create EICAR test file and attempt upload - should be rejected
  echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > eicar.txt
  ```

### 7. Power Automate Flows

- [ ] Email notification flow created
- [ ] Flow triggered by submission to NotificationQueue table
- [ ] Test email delivery before go-live

---

## ✅ SECURITY VERIFICATION

### 8. Security Checklist

- [ ] **Authentication bypass removed** - No optional auth in CRN endpoint
- [ ] **SESSION_SECRET rotated** - Not using development default
- [ ] **All placeholder credentials replaced** - No "placeholder" or "00000000" UUIDs
- [ ] **CORS configured** - Only allows actual frontend URL
- [ ] **HTTPS enforced** - All connections use TLS 1.2+
- [ ] **Test buttons disabled** - `VITE_ENABLE_TEST_BUTTONS=false`
- [ ] **Debug logging disabled** - All console.log statements removed
- [ ] **Mock auth disabled** - `VITE_ENABLE_MOCK_AUTH=false`
- [ ] **Database connections required** - No optional database mode in production
- [ ] **Environment validation enabled** - Backend fails fast if variables missing

---

## 🧪 TESTING & VALIDATION

### 8. Pre-Production Testing

**Test Environment:**
- [ ] Deploy to staging environment first
- [ ] Run full end-to-end tests
- [ ] Test all user workflows:
  - [ ] Requester submission
  - [ ] PBP review and approval
  - [ ] Procurement classification
  - [ ] OPW review (if IR35)
  - [ ] Contract upload
  - [ ] AP Control processing

**Load Testing:**
- [ ] Test with 50 concurrent users minimum
- [ ] Verify response times < 2 seconds for form submissions
- [ ] Verify response times < 1 second for document uploads
- [ ] Monitor database connection pool under load

**Security Testing:**
- [ ] Run OWASP ZAP security scan
- [ ] Test RBAC - verify users can only access authorized pages
- [ ] Test CSRF protection on all POST/PUT/DELETE requests
- [ ] Verify sensitive documents NOT synced to Alemba
- [ ] Test SQL injection attempts (should all fail)
- [ ] Test XSS attacks (should all be escaped)

**Data Integrity:**
- [ ] Test questionnaire uploads appear in PBP review
- [ ] Test document download from SharePoint
- [ ] Verify audit trail captures all actions
- [ ] Test duplicate vendor detection
- [ ] Verify CRN lookup with Companies House

---

## 📋 DEPLOYMENT STEPS

### 9. Backend API Deployment

1. [ ] Build backend for production:
   ```bash
   cd supplier-form-api
   npm ci --production
   ```

2. [ ] Deploy to Azure App Service or server:
   - [ ] Set all environment variables in App Service Configuration
   - [ ] Enable HTTPS only
   - [ ] Configure health check endpoint: `/health`
   - [ ] Set Node.js version to 18 or higher

3. [ ] Verify backend startup:
   - [ ] Check logs for "Production mode: All systems operational"
   - [ ] NO warnings about missing environment variables
   - [ ] Database connection established
   - [ ] SharePoint connection established

### 10. Frontend Deployment

1. [ ] Build frontend for production:
   ```bash
   cd Barts_Health_SSF-main
   npm ci
   npm run build
   ```

2. [ ] Verify build output:
   - [ ] Check `dist/assets/*.js` for devAuth.js (should NOT be included)
   - [ ] Verify all environment variables injected correctly
   - [ ] Check bundle size is reasonable (< 2MB)

3. [ ] Deploy to hosting (VerseOne or Azure Static Web Apps):
   - [ ] Upload `dist/` folder contents
   - [ ] Configure custom domain
   - [ ] Enable HTTPS
   - [ ] Configure redirect rules (all routes to index.html for SPA)

4. [ ] Verify frontend:
   - [ ] Open in browser
   - [ ] Check console for NO errors or warnings
   - [ ] Verify test buttons do NOT appear
   - [ ] Test Azure AD login

---

## 🔍 POST-DEPLOYMENT VALIDATION

### 11. Smoke Tests

**Immediately after deployment:**

- [ ] Homepage loads without errors
- [ ] Azure AD login works
- [ ] User roles correctly detected
- [ ] Form submission creates record in database
- [ ] Documents upload to SharePoint successfully
- [ ] PBP review page displays submission correctly
- [ ] Questionnaire uploads visible in PBP review
- [ ] Email notifications sent via Power Automate
- [ ] Audit trail records all actions

### 12. Monitoring Setup

- [ ] Enable Application Insights (Azure) or equivalent
- [ ] Set up alerts for:
  - [ ] Failed login attempts (> 5 per minute)
  - [ ] Database connection failures
  - [ ] SharePoint upload failures
  - [ ] API response times > 5 seconds
  - [ ] Error rate > 1%
- [ ] Configure log retention (30 days minimum)
- [ ] Set up daily backup verification email

---

## 📚 DOCUMENTATION & TRAINING

### 13. Documentation Updates

- [ ] Update README.md with production URLs
- [ ] Document rollback procedure
- [ ] Create incident response plan
- [ ] Document backup restoration process
- [ ] Update user guide with production screenshots

### 14. User Training

- [ ] Train PBP panel on review workflow
- [ ] Train Procurement team on classification
- [ ] Train OPW panel on IR35 review
- [ ] Train AP Control on vendor creation
- [ ] Provide help desk with support documentation

---

## 🚨 ROLLBACK PLAN

### 15. Rollback Procedure (If Issues Occur)

**Backend Rollback:**
1. [ ] Revert Azure App Service to previous deployment slot
2. [ ] Or restore previous Docker container/deployment
3. [ ] Verify health check endpoint responds

**Frontend Rollback:**
1. [ ] Revert static files to previous version
2. [ ] Clear CDN cache if applicable
3. [ ] Verify homepage loads

**Database Rollback:**
1. [ ] **DO NOT** restore database if submissions exist
2. [ ] Instead, fix forward or hotfix and redeploy
3. [ ] Only restore from backup if data corruption occurred

**Notify Users:**
- [ ] Send email notification of temporary service disruption
- [ ] Post notice on intranet
- [ ] Update status page

---

## ✅ GO-LIVE APPROVAL

### Final Sign-Off Checklist

- [ ] All environment variables configured and verified
- [ ] All security checks passed
- [ ] All smoke tests passed
- [ ] Monitoring and alerts configured
- [ ] Backup tested and working
- [ ] Rollback plan documented and tested
- [ ] User training completed
- [ ] Help desk briefed

**Approved By:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Technical Lead | | | |
| Information Security | | | |
| Data Protection Officer | | | |
| Service Owner | | | |

---

## 📞 SUPPORT CONTACTS

**Technical Issues:**
- IT Service Desk: [servicedesk@bartshealth.nhs.uk]
- Application Support: [appsupport@bartshealth.nhs.uk]

**Security Incidents:**
- Information Security: [infosec@bartshealth.nhs.uk]
- Incident Response: [incident@bartshealth.nhs.uk]

**Escalation:**
- On-Call: [Contact details]
- Technical Lead: [Contact details]

---

## 🔄 ONGOING MAINTENANCE

**Daily:**
- [ ] Check monitoring dashboard for errors
- [ ] Review failed login attempts

**Weekly:**
- [ ] Verify backup completion
- [ ] Review audit logs for anomalies
- [ ] Check disk space and database size

**Monthly:**
- [ ] Test backup restoration
- [ ] Review and rotate secrets (if applicable)
- [ ] Update dependencies (security patches)
- [ ] Review access logs and remove inactive users

**Quarterly:**
- [ ] Security vulnerability scan
- [ ] Review and update documentation
- [ ] User satisfaction survey
- [ ] Performance optimization review

---

## 📄 APPENDIX

### A. Environment Variable Validation Script

Run this before deployment to verify all variables are set:

```bash
# In supplier-form-api/ directory
node -e "
const requiredVars = [
  'SESSION_SECRET', 'CORS_ORIGIN', 'NODE_ENV',
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
  'AZURE_AD_TENANT_ID', 'AZURE_AD_CLIENT_ID', 'AZURE_AD_CLIENT_SECRET',
  'SP_SITE_URL', 'SP_CLIENT_ID', 'SP_CLIENT_SECRET', 'SP_TENANT_ID'
];

const missing = requiredVars.filter(v => !process.env[v] || process.env[v].includes('placeholder'));

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(v => console.error('  -', v));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
}
"
```

### B. Health Check Endpoint

Test backend health:
```bash
curl https://your-api-url/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-04T12:00:00.000Z",
  "version": "1.0.0",
  "database": "connected",
  "sharepoint": "connected"
}
```

### C. Useful SQL Queries

**Check recent submissions:**
```sql
SELECT TOP 10 SubmissionID, Status, CreatedAt, RequesterEmail
FROM Submissions
ORDER BY CreatedAt DESC;
```

**Check audit trail:**
```sql
SELECT TOP 20 Action, UserEmail, Status, Timestamp
FROM AuditTrail
ORDER BY Timestamp DESC;
```

**Check document storage:**
```sql
SELECT DocumentType, COUNT(*) as Count, SUM(FileSize) as TotalSize
FROM SubmissionDocuments
GROUP BY DocumentType;
```

---

**END OF CHECKLIST**

**Important:** Keep this checklist updated with any changes to deployment procedures or requirements.
