# NHS Supplier Setup Form - Consistency Analysis Report

**Version:** 1.0
**Created:** January 2026
**Purpose:** Verify all components of the project are consistent and aligned

---

## Executive Summary

This document provides a comprehensive analysis of consistency across the entire NHS Supplier Setup Form project - code, database schema, documentation, and configuration. Use this document as a checklist during deployment and when IT provides configuration details.

**Overall Status:** Project is consistent and ready for deployment pending IT configuration.

---

## Table of Contents

1. [AD Security Groups](#1-ad-security-groups)
2. [Workflow Stages & Statuses](#2-workflow-stages--statuses)
3. [SQL Schema vs Form Fields](#3-sql-schema-vs-form-fields)
4. [Document Types vs SharePoint Structure](#4-document-types-vs-sharepoint-structure)
5. [NotificationQueue Schema](#5-notificationqueue-schema)
6. [Email Recipients](#6-email-recipients)
7. [Document Governance (Alemba Rules)](#7-document-governance-alemba-rules)
8. [File Size Limits](#8-file-size-limits)
9. [Action Items Checklist](#9-action-items-checklist)

---

## 1. AD Security Groups

### Current Configuration (Synchronized)

| Role | AD Group Name | Files Using This |
|------|---------------|------------------|
| PBP Panel | `NHS-SupplierForm-PBP` | AuthContext.jsx, rbac.js, DEPLOYMENT.md |
| Procurement | `NHS-SupplierForm-Procurement` | AuthContext.jsx, rbac.js, DEPLOYMENT.md |
| OPW Panel | `NHS-SupplierForm-OPW` | AuthContext.jsx, rbac.js, DEPLOYMENT.md |
| Contract Drafter | `NHS-SupplierForm-Contract` | AuthContext.jsx, rbac.js, DEPLOYMENT.md |
| AP Control | `NHS-SupplierForm-APControl` | AuthContext.jsx, rbac.js, DEPLOYMENT.md |
| Admin | `NHS-SupplierForm-Admin` | AuthContext.jsx, rbac.js, DEPLOYMENT.md |

### When IT Provides Different Names

If IT creates groups with different names, update these files:

1. **Frontend:** `src/context/AuthContext.jsx` - Line 26-33 (ROLE_GROUPS object)
2. **Backend:** `supplier-form-api/src/middleware/rbac.js` - Line 12-18 (ROLE_GROUPS object)
3. **Documentation:** `docs/DEPLOYMENT.md` - Section 3.4

**Both frontend and backend MUST have identical group names.**

---

## 2. Workflow Stages & Statuses

### Verification Status: ✅ CONSISTENT

| Stage | Code Value | SQL CurrentStage | Notification Type |
|-------|------------|------------------|-------------------|
| PBP Review | `pbp` | `'pbp'` | `PBP_REVIEW_NEEDED` |
| Procurement | `procurement` | `'procurement'` | `PROCUREMENT_REVIEW_NEEDED` |
| OPW Panel | `opw` | `'opw'` | `OPW_REVIEW_NEEDED` |
| Contract | `contract` | `'contract'` | `CONTRACT_UPLOAD_NEEDED` |
| AP Control | `ap_control` or `ap` | `'ap'` | `AP_REVIEW_NEEDED` |

### Status Values Used

| Status | Meaning | Set By |
|--------|---------|--------|
| `pending_review` | Awaiting PBP review | Initial submission |
| `approved` | Stage approved | Any reviewer approval |
| `rejected` | Request rejected | Any reviewer rejection |
| `info_required` | PBP needs more info | PBP reviewer |
| `Complete` | Supplier setup done | AP Control approval |
| `Rejected_OPW` | Rejected by OPW | OPW reviewer |
| `Rejected_AP` | Rejected by AP | AP Control |

---

## 3. SQL Schema vs Form Fields

### Verification Status: ✅ CONSISTENT

#### Section 1: Requester Information
| Form Field | SQL Column | Type | Status |
|------------|------------|------|--------|
| firstName | RequesterFirstName | NVARCHAR(100) | ✅ |
| lastName | RequesterLastName | NVARCHAR(100) | ✅ |
| jobTitle | RequesterJobTitle | NVARCHAR(100) | ✅ |
| department | RequesterDepartment | NVARCHAR(100) | ✅ |
| nhsEmail | RequesterEmail | NVARCHAR(255) | ✅ |
| phoneNumber | RequesterPhone | NVARCHAR(50) | ✅ |

#### Section 3: Supplier Classification
| Form Field | SQL Column | Type | Status |
|------------|------------|------|--------|
| supplierType | SupplierType | NVARCHAR(50) | ✅ |
| crn | CRN | NVARCHAR(20) | ✅ |
| crnVerified | CRNVerified | BIT | ✅ |
| charityNumber | CharityNumber | NVARCHAR(20) | ✅ |

#### Section 4: Supplier Details
| Form Field | SQL Column | Type | Status |
|------------|------------|------|--------|
| companyName | CompanyName | NVARCHAR(255) | ✅ |
| tradingName | TradingName | NVARCHAR(255) | ✅ |
| registeredAddress | RegisteredAddress | NVARCHAR(500) | ✅ |
| city | City | NVARCHAR(100) | ✅ |
| postcode | Postcode | NVARCHAR(20) | ✅ |
| contactName | ContactName | NVARCHAR(200) | ✅ |
| contactEmail | ContactEmail | NVARCHAR(255) | ✅ |
| contactPhone | ContactPhone | NVARCHAR(50) | ✅ |

#### Section 6: Financial Information
| Form Field | SQL Column | Type | Status |
|------------|------------|------|--------|
| sortCode | SortCode | NVARCHAR(10) | ✅ |
| accountNumber | AccountNumber | NVARCHAR(20) | ✅ |
| iban | IBAN | NVARCHAR(50) | ✅ |
| swiftCode | SwiftCode | NVARCHAR(20) | ✅ |
| vatNumber | VATNumber | NVARCHAR(20) | ✅ |

#### Full Form Backup
| Purpose | SQL Column | Notes |
|---------|------------|-------|
| Complete form JSON | FormDataJSON | NVARCHAR(MAX) - captures ALL fields |

**Note:** Fields like `bankRouting`, `ghxDunsNumber`, `utrNumber`, `plCoverage`, `plExpiry` are captured in `FormDataJSON`.

---

## 4. Document Types vs SharePoint Structure

### Verification Status: ✅ CONSISTENT

#### SupplierDocuments Library (Business Documents)
| Document Type (Code) | Folder | Alemba Sync |
|---------------------|--------|-------------|
| letterhead_bank_details | `/Letterheads/` | ✅ Allowed |
| procurement_approval | `/Other/` | ✅ Allowed |
| cest_form | `/Other/` | ✅ Allowed |
| contract_agreement | `/Contracts/` | ✅ Allowed |
| pbp_certificate | `/PBP_Certificates/` | ✅ Allowed |
| insurance_certificate | `/Insurance_Documents/` | ✅ Allowed |
| vat_certificate | `/VAT_Certificates/` | ✅ Allowed |
| complete_pdf | `/Other/` | ✅ Allowed |

#### SensitiveDocuments Library (ID Documents)
| Document Type (Code) | Folder | Alemba Sync |
|---------------------|--------|-------------|
| passport | `/Passports/` | ❌ NEVER |
| driving_licence | `/DrivingLicences/` | ❌ NEVER |

### Key File
- **Document Definitions:** `src/constants/documentTypes.js`
- **SharePoint Setup Guide:** `next-steps/02-SHAREPOINT-LIBRARIES-SETUP.md`

---

## 5. NotificationQueue Schema

### Verification Status: ✅ CONSISTENT

| Column | SQL Schema | SharePoint List | Match |
|--------|------------|-----------------|-------|
| SubmissionID | NVARCHAR(50) NOT NULL | Single line text (Required) | ✅ |
| NotificationType | NVARCHAR(50) NOT NULL | Choice (Required) | ✅ |
| RecipientEmail | NVARCHAR(255) NOT NULL | Single line text (Required) | ✅ |
| RecipientName | NVARCHAR(200) NULL | Single line text (Optional) | ✅ |
| Subject | NVARCHAR(500) NOT NULL | EmailSubject (Required) | ✅ |
| Body | NVARCHAR(MAX) NOT NULL | EmailBody - Multiple lines (Required) | ✅ |
| Processed | BIT DEFAULT 0 | Yes/No (Default: No) | ✅ |
| ProcessedAt | DATETIME NULL | ProcessedDate (Optional) | ✅ |
| ErrorMessage | NVARCHAR(MAX) NULL | Multiple lines (Optional) | ✅ |

### Notification Types (Must Match in Both)
```
PBP_REVIEW_NEEDED
PBP_APPROVED
PBP_REJECTED
PBP_INFO_REQUESTED
PROCUREMENT_REVIEW_NEEDED
OPW_REVIEW_NEEDED
CONTRACT_UPLOAD_NEEDED
AP_REVIEW_NEEDED
SUPPLIER_COMPLETE
DAILY_REMINDER
ADMIN_ALERT
```

### Key Files
- **SQL Schema:** `supplier-form-api/database/schema.sql`
- **Power Automate Guide:** `next-steps/04-POWER-AUTOMATE-SETUP.md`

---

## 6. Email Recipients

### Verification Status: ✅ DOCUMENTED

| Notification | Recipient | Email Address | Status |
|--------------|-----------|---------------|--------|
| PBP Review Needed | PBP Panel | **TBC** | Awaiting IT |
| PBP Approved/Rejected | Requester | From submission | ✅ Dynamic |
| Procurement Review | Procurement Team | barts.procurement@nhs.net | ✅ Confirmed |
| OPW Review Needed | OPW Panel | Bartshealth.opwpanelbarts@nhs.net | ✅ Confirmed |
| Contract Upload | Contract Team | **TBC** | Awaiting IT |
| AP Control Review | AP Control | Apcontrol.bartshealth@nhs.net | ✅ Confirmed |
| Supplier Complete | Requester | From submission | ✅ Dynamic |
| Admin Alerts | Admin | barts.procurement@nhs.net | ✅ Confirmed |

### Action Required
- Get PBP Panel shared mailbox from IT
- Confirm Contract team email (may share with OPW)

---

## 7. Document Governance (Alemba Rules)

### Verification Status: ✅ CONSISTENT

#### NEVER Sync to Alemba (CRITICAL)
| Document | Code Flag | Reason |
|----------|-----------|--------|
| Passport | `allowAlembaSync: false` | Personal ID - GDPR |
| Driving Licence | `allowAlembaSync: false` | Personal ID - GDPR |

#### Allowed to Sync
| Document | Code Flag |
|----------|-----------|
| PBP Certificate | `allowAlembaSync: true` |
| Letterhead | `allowAlembaSync: true` |
| CEST Form | `allowAlembaSync: true` |
| Contract | `allowAlembaSync: true` |
| VAT Certificate | `allowAlembaSync: true` |
| Insurance Certificate | `allowAlembaSync: true` |
| Complete PDF | `allowAlembaSync: true` |

### Key File
- **Document Governance:** `src/constants/documentTypes.js`

---

## 8. File Size Limits

### Verification Status: ✅ CONSISTENT

| Document | Max Size | File Types |
|----------|----------|------------|
| Letterhead | 10 MB | PDF, PNG, JPG, JPEG |
| Procurement Approval | 10 MB | PDF, PNG, JPG, JPEG |
| CEST Form | 5 MB | PDF only |
| Passport | 5 MB | PDF, PNG, JPG, JPEG |
| Driving Licence | 5 MB | PDF, PNG, JPG, JPEG |
| Contract Agreement | 20 MB | PDF only |
| PBP Certificate | 2 MB | PDF only |
| Complete PDF | 20 MB | PDF only |
| Insurance Certificate | 10 MB | PDF, PNG, JPG, JPEG |
| VAT Certificate | 5 MB | PDF, PNG, JPG, JPEG |

### Key File
- **Size Limits:** `src/constants/documentTypes.js`

---

## 9. Action Items Checklist

### Before Deployment

#### From IT (Required)
- [ ] Azure AD App Registration details
  - [ ] Client ID
  - [ ] Tenant ID
  - [ ] Client Secret
- [ ] AD Security Groups created:
  - [ ] NHS-SupplierForm-PBP
  - [ ] NHS-SupplierForm-Procurement
  - [ ] NHS-SupplierForm-OPW
  - [ ] NHS-SupplierForm-Contract
  - [ ] NHS-SupplierForm-APControl
  - [ ] NHS-SupplierForm-Admin
- [ ] PBP Panel shared mailbox email address
- [ ] Contract team email address (or confirm using OPW)

#### If IT Uses Different AD Group Names
- [ ] Update `src/context/AuthContext.jsx` (frontend)
- [ ] Update `supplier-form-api/src/middleware/rbac.js` (backend)
- [ ] Update `docs/DEPLOYMENT.md` (documentation)
- [ ] Run this consistency check again

#### Infrastructure (Your Tasks)
- [ ] SQL Server database created (Step 1)
- [ ] Schema script executed
- [ ] SharePoint site created (Step 2)
- [ ] SupplierDocuments library with folders
- [ ] SensitiveDocuments library with folders
- [ ] NotificationQueue list created
- [ ] Power Automate flows created (Step 4)

### Post-Deployment Verification
- [ ] Test authentication with each AD group
- [ ] Test document upload to correct library
- [ ] Test notification emails sending
- [ ] Test workflow stage transitions
- [ ] Verify sensitive documents NOT syncing to Alemba

---

## Consistency Check Process

When IT provides configuration details, run through this checklist:

### Step 1: AD Group Names
```
IT provides: _______________
Expected:    NHS-SupplierForm-*

If different:
1. Open src/context/AuthContext.jsx
2. Open supplier-form-api/src/middleware/rbac.js
3. Update ROLE_GROUPS in both files
4. Update docs/DEPLOYMENT.md
```

### Step 2: Azure AD Details
```
Client ID:     _______________
Tenant ID:     _______________
Client Secret: _______________

Update in:
- supplier-form-api/.env
- .env.production (frontend)
```

### Step 3: Email Addresses
```
PBP mailbox:      _______________
Contract mailbox: _______________

Update in:
- next-steps/04-POWER-AUTOMATE-SETUP.md
- Power Automate flows (RecipientEmail)
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial analysis |

---

*Document maintained by: Development Team*
*Last verified: January 2026*
