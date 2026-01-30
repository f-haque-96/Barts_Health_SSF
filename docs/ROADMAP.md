# NHS Supplier Setup Form - Project Roadmap

**Version:** 2.0
**Created:** January 2026
**Author:** Fahimul Haque
**Organisation:** Barts Health NHS Trust

---

## Purpose of This Document

This document tracks the project phases, current status, deployment timeline, and planned future features for the NHS Supplier Setup Form application.

---

## Table of Contents

### Project Status & Timeline
- [Current Project Status](#current-project-status)
- [Deployment Phases](#deployment-phases)
- [Timeline to Launch](#timeline-to-launch)
- [What Has Been Completed](#what-has-been-completed)
- [What Is In Progress](#what-is-in-progress)
- [What Is Blocked](#what-is-blocked)

### Future Features
1. [Feature: VAT Number Validation (HMRC API)](#1-feature-vat-number-validation-hmrc-api)
2. [Feature: Confirmation of Payee (CoP)](#2-feature-confirmation-of-payee-cop)
3. [Feature: Enhanced CRN Verification on AP Page](#3-feature-enhanced-crn-verification-on-ap-page)
4. [Feature: Existing Supplier Data Import & Duplicate Detection](#4-feature-existing-supplier-data-import--duplicate-detection)
5. [Feature: Environment Toggle (Dev/Prod Storage)](#5-feature-environment-toggle-devprod-storage)
6. [Technical Debt & Fixes](#6-technical-debt--fixes)
7. [Implementation Priority](#7-implementation-priority)

---

# PROJECT STATUS & TIMELINE

---

## Current Project Status

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT STATUS OVERVIEW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PHASE 1: Development           ████████████████████████████████  100%     │
│   PHASE 2: Documentation         ████████████████████████████████  100%     │
│   PHASE 3: Infrastructure        ████████████████░░░░░░░░░░░░░░░░   50%     │
│   PHASE 4: IT Dependencies       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    0%     │
│   PHASE 5: Deployment            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    0%     │
│   PHASE 6: Testing & Go-Live     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    0%     │
│                                                                             │
│   OVERALL PROGRESS:              ████████████████░░░░░░░░░░░░░░░░   40%     │
│                                                                             │
│   CURRENT BLOCKER: Waiting for IT (Azure AD)                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Phases

### Phase 1: Development ✅ COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| React frontend (7 form sections) | ✅ Complete | All validation working |
| Review pages (PBP, Procurement, OPW, Contract, AP) | ✅ Complete | Role-based access |
| Backend API structure | ✅ Complete | Express.js with RBAC |
| StorageProvider pattern | ✅ Complete | Dev/Prod toggle works |
| Document governance (Alemba rules) | ✅ Complete | Sensitive docs protected |
| SQL schema design | ✅ Complete | 5 tables ready |
| Production security hardening | ✅ Complete | Test buttons removed |

### Phase 2: Documentation ✅ COMPLETE

| Document | Status | Location |
|----------|--------|----------|
| Deployment Guide | ✅ Complete | `docs/DEPLOYMENT.md` |
| Production Checklist | ✅ Complete | `docs/CHECKLIST.md` |
| Alemba Integration | ✅ Complete | `docs/ALEMBA.md` |
| User Guide (SOP) | ✅ Complete | `docs/USER_GUIDE.md` |
| Future Roadmap | ✅ Complete | `docs/ROADMAP.md` |
| Consistency Analysis | ✅ Complete | `docs/CONSISTENCY_ANALYSIS.md` |
| SQL Server Setup Guide | ✅ Complete | `next-steps/01-SQL-SERVER-SETUP.md` |
| SharePoint Setup Guide | ✅ Complete | `next-steps/02-SHAREPOINT-LIBRARIES-SETUP.md` |
| Supplier Data Export Guide | ✅ Complete | `next-steps/03-SUPPLIER-DATA-EXPORT.md` |
| Power Automate Guide | ✅ Complete | `next-steps/04-POWER-AUTOMATE-SETUP.md` |

### Phase 3: Infrastructure 🔄 IN PROGRESS

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| SQL Server database | ⏳ Pending | Fahimul | Follow `01-SQL-SERVER-SETUP.md` |
| SQL schema execution | ⏳ Pending | Fahimul | Run after database created |
| SharePoint site | ⏳ Pending | Fahimul | Follow `02-SHAREPOINT-LIBRARIES-SETUP.md` |
| SupplierDocuments library | ⏳ Pending | Fahimul | 6 folders |
| SensitiveDocuments library | ⏳ Pending | Fahimul | 4 folders + restricted access |
| NotificationQueue list | ⏳ Pending | Fahimul | For Power Automate |

### Phase 4: IT Dependencies ⏸️ BLOCKED

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Azure AD App Registration | ⏸️ Waiting | IT | Email sent to IT |
| Security Groups creation | ⏸️ Waiting | IT | 6 groups needed |
| Client ID / Tenant ID | ⏸️ Waiting | IT | Required for auth |
| Client Secret | ⏸️ Waiting | IT | Required for API |
| PBP shared mailbox | ⏸️ Waiting | IT | For notifications |

### Phase 5: Deployment ⏸️ BLOCKED (Waiting for Phase 4)

| Task | Status | Dependencies |
|------|--------|--------------|
| Configure backend .env | ⏸️ Blocked | Azure AD details |
| Deploy backend API | ⏸️ Blocked | .env configured |
| Configure frontend .env | ⏸️ Blocked | Azure AD details |
| Build frontend for production | ⏸️ Blocked | .env configured |
| Deploy to VerseOne | ⏸️ Blocked | Build complete |
| Power Automate flows | ⏸️ Blocked | SharePoint + Backend live |

### Phase 6: Testing & Go-Live ⏸️ BLOCKED

| Task | Status | Dependencies |
|------|--------|--------------|
| End-to-end authentication test | ⏸️ Blocked | Deployment complete |
| Role-based access test | ⏸️ Blocked | AD groups created |
| Document upload test | ⏸️ Blocked | SharePoint configured |
| Notification email test | ⏸️ Blocked | Power Automate flows |
| UAT with business users | ⏸️ Blocked | All above complete |
| Go-Live | ⏸️ Blocked | UAT sign-off |

---

## Timeline to Launch

### Estimated Timeline (From IT Response)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT TIMELINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TODAY                                                                      │
│    │                                                                        │
│    ├── You are here: Waiting for IT + doing infrastructure tasks            │
│    │                                                                        │
│  IT RESPONDS (Day 0)                                                        │
│    │                                                                        │
│    ├── Day 0-1: Configure backend with Azure AD details                     │
│    │            Configure frontend environment                              │
│    │                                                                        │
│    ├── Day 1-2: Deploy backend API                                          │
│    │            Deploy frontend to VerseOne                                 │
│    │                                                                        │
│    ├── Day 2-3: Create Power Automate flows                                 │
│    │            Test notifications                                          │
│    │                                                                        │
│    ├── Day 3-4: End-to-end testing                                          │
│    │            Fix any issues found                                        │
│    │                                                                        │
│    ├── Day 4-5: UAT with business users                                     │
│    │            Final adjustments                                           │
│    │                                                                        │
│    └── Day 5+:  GO LIVE                                                     │
│                                                                             │
│  ESTIMATED: 5-7 working days from IT response                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### What You Can Do While Waiting

| Task | Guide | Priority |
|------|-------|----------|
| Create SQL Server database | `next-steps/01-SQL-SERVER-SETUP.md` | HIGH |
| Create SharePoint site & libraries | `next-steps/02-SHAREPOINT-LIBRARIES-SETUP.md` | HIGH |
| Review Power Automate guide | `next-steps/04-POWER-AUTOMATE-SETUP.md` | MEDIUM |
| Prepare supplier data export | `next-steps/03-SUPPLIER-DATA-EXPORT.md` | LOW (future) |

---

## What Has Been Completed

### Application Code ✅
- [x] Complete React frontend with 7 form sections
- [x] Form validation using Zod schemas
- [x] Progressive disclosure in Section 2
- [x] CRN verification with Companies House API
- [x] File upload with governance rules
- [x] PBP Review page with approval/rejection/info request
- [x] Procurement Review page with classification
- [x] OPW Review page with IR35 determination
- [x] Contract Drafter page with upload
- [x] AP Control Review page with verification checks
- [x] Requester Response page for PBP questions
- [x] Role-based access control (frontend)
- [x] StorageProvider pattern (localStorage/API toggle)
- [x] Production security (test buttons removed)

### Backend API ✅
- [x] Express.js API structure
- [x] RBAC middleware
- [x] Azure AD authentication setup
- [x] SQL Server connection config
- [x] SharePoint integration config
- [x] Audit trail logging
- [x] API routes for all operations

### Database ✅
- [x] SQL schema designed
- [x] Submissions table
- [x] SubmissionDocuments table
- [x] AuditTrail table
- [x] VendorsReference table
- [x] NotificationQueue table
- [x] Helper functions and stored procedures
- [x] Work queue views

### Documentation ✅
- [x] Deployment guide
- [x] Production checklist
- [x] Alemba integration guide
- [x] User guide (SOP)
- [x] Roadmap with future features
- [x] Consistency analysis report
- [x] Step-by-step setup guides

---

## What Is In Progress

| Task | Status | Next Step |
|------|--------|-----------|
| SQL Server setup | 🔄 Ready to start | Follow guide, connect to server |
| SharePoint setup | 🔄 Ready to start | Follow guide, create site |
| IT coordination | 🔄 Email sent | Await response |

---

## What Is Blocked

| Blocker | Impact | Resolution |
|---------|--------|------------|
| Azure AD from IT | Cannot deploy | Wait for IT response |
| AD Security Groups | Cannot test roles | Wait for IT to create |
| PBP mailbox | Cannot configure notifications | Wait for IT |

---

## Key Contacts

| Role | Contact | For |
|------|---------|-----|
| IT Service Desk | [Standard IT channel] | Azure AD, Security Groups |
| SharePoint Admin | [Your SharePoint admin] | Site permissions issues |
| Database Admin | [Your DBA] | SQL Server access |
| Project Owner | Fahimul Haque | All project decisions |

---

## Quick Reference: Configuration Files to Update

When IT provides details, update these files:

| Detail | File | Location |
|--------|------|----------|
| Client ID | `supplier-form-api/.env` | `AZURE_AD_CLIENT_ID=` |
| Client ID | `.env.production` | `VITE_AZURE_CLIENT_ID=` |
| Tenant ID | `supplier-form-api/.env` | `AZURE_AD_TENANT_ID=` |
| Tenant ID | `.env.production` | `VITE_AZURE_TENANT_ID=` |
| Client Secret | `supplier-form-api/.env` | `AZURE_AD_CLIENT_SECRET=` |
| AD Group Names | `src/context/AuthContext.jsx` | `ROLE_GROUPS` object |
| AD Group Names | `supplier-form-api/src/middleware/rbac.js` | `ROLE_GROUPS` object |

---

# FUTURE FEATURES

The sections below outline planned enhancements for after initial deployment.

---

## 1. Feature: VAT Number Validation (HMRC API)

### Context
AP Control staff need to verify that the VAT number provided by suppliers is valid and matches the company name on the form. Currently this is done manually by checking HMRC's website. This should be automated.

### Business Need
- Prevent fraud (fake VAT numbers)
- Reduce manual checking time
- Ensure VAT reclaim accuracy
- Flag mismatches for investigation

### Technical Specification

#### API Details
```
Provider: HMRC VAT API (Free, Government)
Base URL: https://api.service.hmrc.gov.uk
Endpoint: GET /organisations/vat/check-vat-number/lookup/{vatNumber}
Auth: OAuth 2.0 (Application-restricted)
Rate Limit: 5 requests per second
```

#### Registration Required
1. Register at https://developer.service.hmrc.gov.uk
2. Create application for "VAT (MTD)" API
3. Get Client ID and Client Secret
4. Store in backend environment variables

#### API Response Example
```json
{
  "target": {
    "name": "ACME SOLUTIONS LTD",
    "vatNumber": "123456789",
    "address": {
      "line1": "123 Business Street",
      "postcode": "EC1A 1BB",
      "countryCode": "GB"
    }
  },
  "processingDate": "2026-01-30T10:30:00Z"
}
```

#### Implementation Location
- **Backend**: `supplier-form-api/src/services/vatService.js` (new file)
- **Backend Route**: `supplier-form-api/src/routes/validation.js` (new file)
- **Frontend**: `src/pages/APControlReviewPage.jsx` (add verification section)

#### UI Behaviour
```
┌─────────────────────────────────────────────────────────────┐
│ VAT Verification                                [Verify]    │
│ VAT Number: GB123456789                                     │
│                                                             │
│ Status: ✅ VALID                                            │
│ Registered Name: ACME SOLUTIONS LTD                         │
│ Form Name: Acme Solutions Ltd                               │
│ Match: ✅ Names match                                       │
└─────────────────────────────────────────────────────────────┘

OR if mismatch:

┌─────────────────────────────────────────────────────────────┐
│ VAT Verification                                [Verify]    │
│ VAT Number: GB123456789                                     │
│                                                             │
│ Status: ⚠️ NAME MISMATCH                                   │
│ Registered Name: ACME LTD                                   │
│ Form Name: Acme Solutions Ltd                               │
│ ⚠️ Please verify this is the same company                  │
└─────────────────────────────────────────────────────────────┘
```

#### Environment Variables Needed
```env
# HMRC VAT API
HMRC_API_URL=https://api.service.hmrc.gov.uk
HMRC_CLIENT_ID=your-hmrc-client-id
HMRC_CLIENT_SECRET=your-hmrc-client-secret
```

---

## 2. Feature: Confirmation of Payee (CoP)

### Context
Confirmation of Payee is a UK banking initiative that verifies the account holder's name matches the name provided before a payment is made. This helps prevent:
- Authorised Push Payment (APP) fraud
- Accidental misdirected payments
- Invoice redirection fraud

AP Control needs this to verify bank details before creating a supplier.

### Business Need
- Prevent payment fraud (critical for NHS)
- Verify bank account ownership
- Reduce manual bank verification calls
- Meet audit requirements

### Technical Specification

#### Service Provider Options
| Provider | Type | Estimated Cost | API Availability |
|----------|------|----------------|------------------|
| **Pay.UK** | Official scheme | Via bank | Through your bank |
| **Modulr** | Fintech | ~£0.20/check | REST API |
| **Banking Circle** | B2B Payments | ~£0.15/check | REST API |
| **Barclays/Lloyds** | Your bank | Ask relationship manager | Varies |

#### Recommended Approach
1. **First**: Ask Barts Health bank (likely Barclays/Lloyds/NatWest) if they offer CoP API
2. **Fallback**: Use Modulr or similar fintech provider

#### API Request (Generic)
```json
POST /api/confirmation-of-payee
{
  "sortCode": "123456",
  "accountNumber": "12345678",
  "accountName": "Acme Solutions Ltd",
  "accountType": "business"
}
```

#### API Response
```json
{
  "result": "MATCH",           // MATCH, CLOSE_MATCH, NO_MATCH, NOT_FOUND
  "actualName": "ACME SOLUTIONS LTD",
  "matchScore": 100,
  "reason": null
}
```

#### Result Handling
| Result | Action |
|--------|--------|
| `MATCH` | ✅ Show green tick, allow proceed |
| `CLOSE_MATCH` | ⚠️ Show warning with both names, require confirmation |
| `NO_MATCH` | ❌ Show error, require manual verification |
| `NOT_FOUND` | ⚠️ Account not enrolled in CoP, warn user |

#### Implementation Location
- **Backend**: `supplier-form-api/src/services/copService.js` (new file)
- **Backend Route**: `supplier-form-api/src/routes/validation.js`
- **Frontend**: `src/pages/APControlReviewPage.jsx`

#### UI Behaviour
```
┌─────────────────────────────────────────────────────────────┐
│ Bank Account Verification                       [Verify]    │
│ Sort Code: 12-34-56                                         │
│ Account: 12345678                                           │
│ Name: Acme Solutions Ltd                                    │
│                                                             │
│ ✅ CONFIRMED: Account holder name matches                   │
│ Verified: ACME SOLUTIONS LTD                                │
└─────────────────────────────────────────────────────────────┘
```

#### Environment Variables Needed
```env
# Confirmation of Payee Provider
COP_PROVIDER=modulr  # or 'bank', 'banking_circle'
COP_API_URL=https://api.modulr.com
COP_API_KEY=your-cop-api-key
COP_API_SECRET=your-cop-api-secret
```

---

## 3. Feature: Enhanced CRN Verification on AP Page

### Context
CRN (Company Registration Number) verification via Companies House API already exists in the form (Section 3). However, AP Control should also be able to re-verify and see the full company details on their review page before approving.

### Business Need
- Double-check company is still active
- Verify company hasn't been dissolved since form submission
- See registered office address for comparison
- View company officers if needed

### Technical Specification

#### Existing Code Location
- `src/utils/companiesHouse.js` - Already has API integration
- `src/hooks/useCRNVerification.js` - Hook for verification

#### What to Add to AP Page
1. **Re-verify button** - Calls Companies House API again
2. **Company status display** - Active, Dissolved, Liquidation, etc.
3. **Registered address comparison** - Compare with form address
4. **Last filed accounts date** - Indicator of company health

#### API Endpoint (Existing)
```
GET /api/companies-house/:crn
```

#### Enhanced Response Display
```
┌─────────────────────────────────────────────────────────────┐
│ Company Registration Verification               [Re-verify] │
│ CRN: 12345678                                               │
│                                                             │
│ ✅ VERIFIED - Companies House                               │
│                                                             │
│ Registered Name: ACME SOLUTIONS LIMITED                     │
│ Status: Active                                              │
│ Incorporated: 15 March 2015                                 │
│ Company Type: Private Limited Company                       │
│                                                             │
│ Registered Office:                                          │
│ 123 Business Street, London, EC1A 1BB                       │
│                                                             │
│ Form Address:                                               │
│ 123 Business Street, London, EC1A 1BB                       │
│ ✅ Addresses match                                          │
│                                                             │
│ Last Accounts Filed: 31 December 2025                       │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation Location
- **Frontend**: `src/pages/APControlReviewPage.jsx` (add section)
- **Backend**: Already exists, may need to return more fields

---

## 4. Feature: Existing Supplier Data Import & Duplicate Detection

### Context
Barts Health has thousands of existing suppliers in their finance system. When a new supplier request comes in, AP Control needs to check if the supplier already exists to avoid duplicates. Currently this is a manual process.

### Business Need
- Prevent duplicate supplier records
- Save time on manual checking
- Maintain data quality in finance system
- Flag potential duplicates for review

### Technical Specification

#### Data Source
- Export from Oracle/Finance system (or whatever ERP Barts uses)
- Fields needed: Vendor Number, Company Name, VAT Number, CRN

#### Database Table (Already Created)
```sql
-- Table: VendorsReference (in schema.sql)

VendorID          INT PRIMARY KEY
VendorNumber      NVARCHAR(50)      -- e.g., V001, V002
CompanyName       NVARCHAR(255)     -- e.g., "Acme Solutions Ltd"
NormalizedName    NVARCHAR(255)     -- e.g., "acme solutions" (for matching)
TradingName       NVARCHAR(255)     -- Alternative name if different
CRN               NVARCHAR(20)      -- Company Registration Number
VATNumber         NVARCHAR(20)      -- VAT Number
IsActive          BIT               -- 1 = Active, 0 = Inactive
CreatedAt         DATETIME
UpdatedAt         DATETIME
```

#### Import Process
```
┌─────────────────────────────────────────────────────────────┐
│                   ONE-TIME DATA IMPORT                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 1: Export from Finance System                         │
│          ↓                                                   │
│          CSV file with supplier data                         │
│                                                              │
│  STEP 2: Clean/Format Data                                   │
│          - Remove special characters                         │
│          - Standardize VAT format (add GB prefix)           │
│          - Fill missing CRNs if possible                    │
│                                                              │
│  STEP 3: Import to SQL Server                               │
│          - Use SSMS Import Wizard, OR                       │
│          - BULK INSERT command, OR                          │
│          - Custom import script                             │
│                                                              │
│  STEP 4: Generate NormalizedName column                     │
│          - Run: UPDATE VendorsReference                     │
│                 SET NormalizedName =                        │
│                 dbo.NormalizeCompanyName(CompanyName)       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Duplicate Detection Logic
```javascript
// When checking for duplicates, check in order:
// 1. Exact VAT match (highest confidence)
// 2. Exact CRN match (high confidence)
// 3. Fuzzy name match > 85% (needs review)

async function checkDuplicate(companyName, vatNumber, crn) {
  // Check 1: VAT Number (exact match)
  if (vatNumber) {
    const vatMatch = await findByVAT(vatNumber);
    if (vatMatch) return { type: 'EXACT_VAT', vendor: vatMatch };
  }

  // Check 2: CRN (exact match)
  if (crn) {
    const crnMatch = await findByCRN(crn);
    if (crnMatch) return { type: 'EXACT_CRN', vendor: crnMatch };
  }

  // Check 3: Fuzzy name match
  const nameMatches = await fuzzyNameSearch(companyName, 0.85);
  if (nameMatches.length > 0) {
    return { type: 'POTENTIAL_MATCH', vendors: nameMatches };
  }

  return { type: 'NO_MATCH' };
}
```

#### API Endpoint Needed
```
GET /api/validate/duplicate?companyName=X&vatNumber=Y&crn=Z

Response:
{
  "isDuplicate": true,
  "matchType": "EXACT_VAT",
  "existingVendor": {
    "vendorNumber": "V001",
    "companyName": "Acme Ltd",
    "vatNumber": "GB123456789"
  },
  "potentialMatches": []
}
```

#### UI on AP Review Page
```
┌─────────────────────────────────────────────────────────────┐
│ Duplicate Supplier Check                        [Check]     │
│                                                             │
│ ⚠️ POTENTIAL DUPLICATE FOUND                               │
│                                                             │
│ This submission may be a duplicate:                         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Existing Vendor: V001                                   │ │
│ │ Name: Acme Ltd                                          │ │
│ │ VAT: GB123456789 ← MATCHES                              │ │
│ │ Status: Active                                          │ │
│ │                                                         │ │
│ │ [View Full Details]                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Actions:                                                    │
│ ○ Reject as duplicate                                       │
│ ○ This is a different company (explain why)                │
│ ○ Update existing vendor record instead                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation Files
- **Backend**: `supplier-form-api/src/services/duplicateService.js` (new)
- **Backend Route**: `supplier-form-api/src/routes/validation.js`
- **Frontend**: `src/pages/APControlReviewPage.jsx`
- **Import Script**: `supplier-form-api/scripts/importVendors.js` (new)

#### CSV Import Template
```csv
VendorNumber,CompanyName,TradingName,VATNumber,CRN,IsActive
V001,Acme Solutions Ltd,,GB123456789,12345678,1
V002,Smith Consulting Ltd,Smith & Co,GB987654321,87654321,1
V003,NHS Supply Chain,,,00012345,1
```

---

## 5. Feature: Environment Toggle (Dev/Prod Storage)

### Context
Developers need to test the application locally using localStorage (browser storage) without needing the full backend. In production, the app should use the API and SQL database.

### Current Status: ✅ ALREADY IMPLEMENTED

This feature was built during the production security refactor.

### How It Works

#### Storage Provider (`src/services/StorageProvider.js`)
```javascript
// Automatically selects storage based on environment

if (import.meta.env.VITE_APP_ENV === 'development') {
  // Uses LocalStorageProvider
  // Data stored in browser localStorage
  // No backend needed
} else {
  // Uses ApiStorageProvider
  // Data stored in SQL via API
  // Full authentication required
}
```

#### Environment Files
```env
# .env.local (development)
VITE_APP_ENV=development
VITE_ENABLE_MOCK_AUTH=true

# .env.production (production)
VITE_APP_ENV=production
VITE_ENABLE_MOCK_AUTH=false
```

#### Usage
```bash
# Development (localStorage)
npm run dev

# Production build (API/SQL)
npm run build && npm run preview
```

### No Further Action Required
This feature is complete and working.

---

## 6. Technical Debt & Fixes

### 6.1 Add Loading States to Verification Buttons
**Location**: All review pages
**Issue**: When verification APIs are called, there's no loading indicator
**Fix**: Add loading spinners to verify buttons

### 6.2 Cache API Responses
**Location**: Backend services
**Issue**: Same CRN/VAT could be verified multiple times, wasting API calls
**Fix**: Add Redis or in-memory caching for verification results (cache for 24 hours)

### 6.3 Add Retry Logic for External APIs
**Location**: `companiesHouse.js`, new `vatService.js`, `copService.js`
**Issue**: External APIs may have intermittent failures
**Fix**: Add retry with exponential backoff (3 attempts)

### 6.4 Bulk Verification Option
**Location**: AP Review Page
**Issue**: AP Control may want to verify all fields at once
**Fix**: Add "Verify All" button that runs all checks simultaneously

### 6.5 Verification Audit Trail
**Location**: AuditTrail table
**Issue**: Need to record when verifications were done and results
**Fix**: Log all verification attempts with results to AuditTrail

### 6.6 Offline Handling
**Location**: Frontend
**Issue**: If verification APIs are down, user gets stuck
**Fix**: Allow proceeding with manual override + warning flag

---

## 7. Implementation Priority

### Phase 1: Quick Wins (1-2 days each)
| Priority | Feature | Complexity | Value |
|----------|---------|------------|-------|
| 1 | Enhanced CRN on AP Page | Low | Medium |
| 2 | Duplicate Detection (after data import) | Low | High |
| 3 | Loading states fix | Low | Low |

### Phase 2: Medium Effort (3-5 days each)
| Priority | Feature | Complexity | Value |
|----------|---------|------------|-------|
| 4 | VAT Checker (HMRC API) | Medium | High |
| 5 | Existing Supplier Import | Medium | High |
| 6 | Verification Audit Trail | Medium | Medium |

### Phase 3: Larger Effort (1-2 weeks)
| Priority | Feature | Complexity | Value |
|----------|---------|------------|-------|
| 7 | Confirmation of Payee | High | High |
| 8 | Caching Layer | Medium | Medium |

---

## API Keys & Services Needed

| Service | Registration URL | Cost |
|---------|------------------|------|
| HMRC VAT API | https://developer.service.hmrc.gov.uk | Free |
| Companies House | https://developer.company-information.service.gov.uk | Free |
| Confirmation of Payee | Via bank or Modulr/Banking Circle | £0.15-0.20/check |

---

## Notes for Future Development Sessions

1. **StorageProvider already handles dev/prod toggle** - No additional work needed
2. **VendorsReference table exists** - Just needs data imported
3. **Companies House integration exists** - Just needs exposing on AP page
4. **All verification should happen on AP Review page** - Central location for checks
5. **Sensitive documents (passports, IDs) must NEVER sync to Alemba** - Governance is built in

---

## Contact

For questions about this roadmap:
- **Developer**: Fahimul Haque
- **Department**: Systems & Data
- **Organisation**: Barts Health NHS Trust

---

*Document Version: 1.0*
*Last Updated: January 2026*
