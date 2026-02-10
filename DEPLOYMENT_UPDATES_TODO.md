# NHS Supplier Setup Form - Deployment Updates TODO

This document outlines the necessary updates to deployment and user documentation following the Phase 4, 5, and 6 fixes completed in February 2026.

## Overview

All Phase 4, 5, and 6 fixes have been successfully applied to the codebase. The following documentation updates are needed to reflect these changes.

---

## 1. DEPLOYMENT.md Updates Required

### 1.1 Environment Variables Section
**Location:** `docs/deployment/DEPLOYMENT.md` - Environment Variables section

**Updates needed:**
- Add documentation for the new required environment variables:
  - `CH_API_KEY` - Companies House API key (required for production)
  - `CH_API_URL` - Companies House API URL (required for production)
  - `AP_CONTROL_EMAIL` - AP Control email for vendor number assignment notifications (required for production)

**Example addition:**
```markdown
### Companies House Integration (Production Required)
- `CH_API_KEY` - API key from Companies House developer portal
- `CH_API_URL` - https://api.company-information.service.gov.uk

### Email Notifications (Production Required)
- `AP_CONTROL_EMAIL` - Email address for AP Control team notifications (e.g., ap.control@bartshealth.nhs.uk)
```

### 1.2 Database Setup Section
**Location:** `docs/deployment/DEPLOYMENT.md` - Database Setup section

**Updates needed:**
- Note that schema.sql now supports idempotent execution (IF NOT EXISTS clauses)
- Mention the new Sessions table for session management
- Document that re-running the schema is safe and won't cause errors

**Example addition:**
```markdown
## Database Schema Updates

The database schema (`supplier-form-api/database/schema.sql`) has been enhanced with:

1. **Idempotent Execution**: All CREATE statements now use `IF NOT EXISTS` checks
   - Safe to re-run the schema multiple times
   - Useful for updates and deployments

2. **New Sessions Table**: For authentication session tracking
   - Stores user session data
   - Enables session-based authentication

To apply schema updates:
```sql
-- Run the entire schema.sql file - it will skip existing objects
sqlcmd -S your-server -d NHSSupplierForms -i database/schema.sql
```
```

### 1.3 Authentication Section
**Location:** `docs/deployment/DEPLOYMENT.md` - Authentication & Security section

**Updates needed:**
- Document that `/api/health/detailed` now requires authentication
- Note that dev mode mock users now have `groups` instead of `roles`
- Explain the devBypassAuth behavior for development

**Example addition:**
```markdown
## Health Check Endpoints

- `/health` - Public health check (no authentication required)
- `/api/health/detailed` - Detailed health check (requires authentication)
  - Shows database and SharePoint connection status
  - Only accessible to authenticated users in production
  - Bypasses auth in development mode

## Development Authentication Bypass

In development mode (`NODE_ENV !== 'production`), the `devBypassAuth` middleware creates a mock user:
```javascript
{
  oid: 'dev-user',
  email: 'dev@localhost',
  name: 'Development User',
  groups: ['NHS-SupplierForm-Admin']
}
```

This allows testing without Azure AD configuration in local development.
```

---

## 2. USER_GUIDE.md Updates Required

### 2.1 Email Validation Documentation
**Location:** `docs/USER_GUIDE.md` - User Information section

**Updates needed:**
- Update NHS email validation to include all supported domains
- Document the expanded list of accepted NHS email domains

**Example addition:**
```markdown
## NHS Email Requirements

The system now accepts the following NHS email domains:
- @nhs.net (standard NHS email)
- @nhs.uk (NHS UK email)
- @bartshealth.nhs.uk (Barts Health specific)
- @nhs.scot (NHS Scotland)
- @wales.nhs.uk (NHS Wales)

Both frontend and backend validation enforce these domains to ensure only NHS staff can submit forms.
```

### 2.2 Usage Frequency Options
**Location:** `docs/USER_GUIDE.md` - Pre-screening section

**Updates needed:**
- Update the usage frequency options from "Frequent" to "Regular"

**Example change:**
```markdown
## Supplier Usage Frequency

Select how often you expect to use this supplier:
- **One-off**: Single transaction or project
- **Occasional**: Infrequent use (a few times per year)
- **Regular**: Ongoing or frequent use (monthly or more)
```

### 2.3 Workflow Status Updates
**Location:** `docs/USER_GUIDE.md` - Workflow section

**Updates needed:**
- Document that AP approval now transitions to "completed" status
- Clarify the terminal state of the workflow

**Example addition:**
```markdown
## Workflow Terminal States

### AP Control Approval (Final Stage)
When AP Control approves a submission:
- Status changes to: `ap_approved`
- Current stage changes to: `completed`
- Vendor number is assigned
- Form workflow is complete

This is the final stage - no further approvals are required.
```

---

## 3. ROADMAP.md Updates Required

### 3.1 Completed Features Section
**Location:** `docs/ROADMAP.md` - Completed section

**Updates needed:**
- Mark the following as completed in February 2026:
  - Enhanced NHS email validation (multiple domains)
  - Idempotent database schema
  - Work queue filtering by CurrentStage
  - Session table implementation
  - Environment variable validation improvements

**Example addition:**
```markdown
## Completed - February 2026

### Security & Validation Enhancements
- [x] Enhanced NHS email validation (supports @nhs.net, @nhs.uk, @bartshealth.nhs.uk, @nhs.scot, @wales.nhs.uk)
- [x] Added requireAuth to detailed health check endpoint
- [x] Fixed devBypassAuth to use groups instead of roles
- [x] Added CH_API and AP_CONTROL_EMAIL to production environment validation

### Database & Infrastructure
- [x] Idempotent database schema (IF NOT EXISTS on all CREATE statements)
- [x] Added Sessions table for session management
- [x] Work queue filtering by CurrentStage for improved performance

### Bug Fixes
- [x] Fixed AP terminal state (now transitions to 'completed')
- [x] Removed duplicate CIS validation checks in form store
- [x] Fixed USAGE_FREQUENCIES constant (frequent → regular)
- [x] Removed duplicate environment validation block
```

---

## 4. API Documentation Updates

### 4.1 Work Queue Endpoint
**Location:** API documentation (if exists) or create inline comments

**Updates needed:**
- Document that work queue now filters by both Status AND CurrentStage
- This improves query performance and ensures accurate queue results

**Example:**
```markdown
### GET /api/reviews/:stage/queue

Returns work queue for a specific review stage.

**Query Logic:**
- Filters by both Status (from stage-specific status map) AND CurrentStage
- Ensures only submissions at the correct workflow stage are returned
- Improves database query performance with dual index usage

**Example:**
```sql
WHERE Status IN ('pending_review', 'pending_pbp_review', 'info_required')
  AND CurrentStage = 'pbp'
```
```

---

## 5. .env.example Updates

**Status:** ✅ COMPLETED

The `.env.example` file has been updated with:
- `AP_CONTROL_EMAIL` variable with example value
- All required production variables documented
- Clear comments explaining each variable

---

## 6. Testing & Validation Checklist

Before updating user-facing documentation, ensure the following have been tested:

### Backend Testing
- [ ] Verify `/api/health/detailed` requires authentication in production
- [ ] Test work queue filtering (verify CurrentStage filter is applied)
- [ ] Confirm AP approval transitions to 'completed' status
- [ ] Validate NHS email domains (@nhs.net, @nhs.uk, @bartshealth.nhs.uk, etc.)
- [ ] Test environment validation on startup (missing CH_API_KEY, etc.)

### Frontend Testing
- [ ] Verify NHS email validation accepts all domains
- [ ] Confirm USAGE_FREQUENCIES shows "Regular" instead of "Frequent"
- [ ] Test that duplicate CIS checks are removed (form submission works)

### Database Testing
- [ ] Run schema.sql on existing database (should not error with IF NOT EXISTS)
- [ ] Verify Sessions table is created
- [ ] Test CheckDuplicateVendor stored procedure still works

---

## 7. Deployment Sequence

When deploying these changes to production:

1. **Database First:**
   ```bash
   # Apply updated schema (safe due to IF NOT EXISTS)
   sqlcmd -S production-server -d NHSSupplierForms -i supplier-form-api/database/schema.sql
   ```

2. **Environment Variables:**
   ```bash
   # Add new required variables to production .env
   CH_API_KEY=<your-key>
   CH_API_URL=https://api.company-information.service.gov.uk
   AP_CONTROL_EMAIL=ap.control@bartshealth.nhs.uk
   ```

3. **Backend Deployment:**
   ```bash
   cd supplier-form-api
   npm install  # Install any new dependencies
   npm run build  # If applicable
   pm2 restart nhs-supplier-api  # Or your process manager
   ```

4. **Frontend Deployment:**
   ```bash
   npm install
   npm run build
   # Deploy dist/ to web server
   ```

5. **Validation:**
   - Test health check endpoints
   - Submit a test form with NHS email
   - Verify AP approval workflow completes
   - Check audit logs for proper tracking

---

## 8. Summary of Code Changes

For reference, here are all the files modified:

### Phase 4 (Medium Priority)
- ✅ `supplier-form-api/src/app.js` - Added requireAuth import, applied to /api/health/detailed, removed duplicate env validation, added CH_API vars
- ✅ `supplier-form-api/src/routes/index.js` - Added 'ap': 'completed' to nextStages map
- ✅ `supplier-form-api/src/middleware/validation.js` - Updated NHS email regex
- ✅ `supplier-form-api/src/services/submissionService.js` - Added CurrentStage filter to SQL query

### Phase 5 (Low Priority)
- ✅ `supplier-form-api/src/middleware/auth.js` - Fixed devBypassAuth (roles → groups)
- ✅ `src/utils/helpers.js` - Updated validators.nhsEmail to check all NHS domains
- ✅ `src/stores/formStore.js` - Removed duplicate CIS checks in canSubmitForm()
- ✅ `src/utils/constants.js` - Changed 'frequent' to 'regular'

### Phase 6 (Documentation)
- ✅ `supplier-form-api/.env.example` - Added AP_CONTROL_EMAIL
- ✅ `supplier-form-api/database/schema.sql` - Added IF NOT EXISTS to all CREATE statements, added Sessions table
- ✅ `DEPLOYMENT_UPDATES_TODO.md` - Created this comprehensive update guide

---

## Next Steps

1. Review this document with the technical team
2. Assign documentation updates to appropriate team members
3. Schedule deployment window for production
4. Update documentation (DEPLOYMENT.md, USER_GUIDE.md, ROADMAP.md)
5. Deploy to production following the sequence above
6. Communicate changes to end users (especially NHS email domains)

---

**Document Created:** February 2026
**Status:** All code fixes completed, documentation updates pending
**Priority:** Medium - Update before next production deployment
