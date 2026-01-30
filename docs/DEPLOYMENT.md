# NHS Supplier Setup Form - Deployment Guide

**Version:** 3.0
**Last Updated:** January 2026
**For:** Barts Health NHS Trust

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
│                         PRODUCTION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐                                                       │
│  │  VerseOne/WeShare │  (React Frontend)                                    │
│  │  Intranet Page    │                                                       │
│  └────────┬─────────┘                                                       │
│           │ Azure AD SSO                                                     │
│           ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │              EXPRESS.JS API (Azure App Service)                   │       │
│  │                                                                   │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │       │
│  │  │ Auth/RBAC   │  │ Submissions │  │ Documents   │               │       │
│  │  │ Middleware  │  │ Service     │  │ Service     │               │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│           │                │                │                                │
│           ▼                ▼                ▼                                │
│  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐                  │
│  │  SQL Server     │  │  SQL Server │  │  SharePoint     │                  │
│  │  (Auth/Audit)   │  │  (Data)     │  │  (Documents)    │                  │
│  └─────────────────┘  └─────────────┘  └────────┬────────┘                  │
│                                                  │                           │
│                                                  ▼                           │
│                              ┌─────────────────────────────────┐            │
│                              │       Power Automate            │            │
│                              │  (Notifications via SP triggers)│            │
│                              └─────────────────────────────────┘            │
│                                                                              │
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
| `SupplierDocuments` | VAT certs, contracts, letterheads | ✅ Allowed |
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
   - `/VAT_Certificates/`
   - `/Contracts/`
   - `/Letterheads/`
   - `/PBP_Certificates/`

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

Create `.env` on the server (or configure in Azure App Service):

```env
# Azure AD
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# SQL Server
DB_SERVER=your-sql-server.database.windows.net
DB_DATABASE=NHSSupplierForms
DB_USER=SupplierFormAPI
DB_PASSWORD=YourSecurePassword
DB_ENCRYPT=true

# SharePoint
SP_TENANT_ID=your-tenant-id
SP_CLIENT_ID=sharepoint-app-client-id
SP_CLIENT_SECRET=sharepoint-app-secret
SP_SITE_URL=https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms

# Companies House
CH_API_KEY=your-companies-house-api-key
CH_API_URL=https://api.company-information.service.gov.uk

# Application
NODE_ENV=production
PORT=3001
```

### 6.2 Deploy to Azure App Service

```bash
# In supplier-form-api folder
npm install
npm start

# Or deploy via Azure CLI
az webapp up --name nhs-supplier-api --resource-group your-rg
```

### 6.3 Test API

```bash
curl https://your-api.azurewebsites.net/api/health
# Should return: {"status":"ok"}
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

- [ ] Azure AD authentication working
- [ ] All security groups can access their pages
- [ ] SQL database accepting connections
- [ ] SharePoint document upload working
- [ ] Sensitive documents going to correct library
- [ ] Email notifications sending
- [ ] Audit trail logging all actions

### Test Scenarios

**Note:** PBP reviews the QUESTIONNAIRE (pre-submission), not the full form. Procurement is the first stage after form submission.

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

---

## 10. Troubleshooting

### Common Issues

#### "401 Unauthorized" on API calls
- Check Azure AD token is valid
- Verify Client ID matches
- Check user is in required security group

#### Documents not uploading
- Check SharePoint permissions
- Verify SP_CLIENT_ID has Files.ReadWrite.All
- Check folder structure exists

#### Notifications not sending
- Check Power Automate flow is enabled
- Verify SharePoint trigger is configured
- Check email addresses are valid

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

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session` | GET | Get current user info |
| `/api/submissions` | POST | Create submission |
| `/api/submissions/:id` | GET | Get submission |
| `/api/reviews/:stage/queue` | GET | Get work queue |
| `/api/documents/:submissionId` | POST | Upload document |

### Environment Files

| File | Purpose |
|------|---------|
| `.env.local` | Local development |
| `.env.production` | Production build |
| `supplier-form-api/.env` | Backend API config |

---

*Document maintained by: Development Team*
*Last updated: January 2026*
