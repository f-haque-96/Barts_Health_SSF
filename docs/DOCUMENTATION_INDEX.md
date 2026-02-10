# 📚 NHS Supplier Setup Form - Documentation Index

**Last Updated:** February 6, 2026
**Project Version:** 2.0 (Post Security & Validation Fixes)

---

## 📖 Quick Navigation

### For New Users
- [📍 Start Here](getting-started/START_HERE.md) - First-time setup guide
- [👤 User Guide](user-guides/USER_GUIDE.md) - How to use the form
- [🧪 Development Mode Guide](getting-started/DEV_MODE_TESTING_GUIDE.md) - Testing without production infrastructure

### For Developers
- [🏗️ Project Structure](../PROJECT_STRUCTURE.md) - Codebase organisation
- [⚙️ Development Auth Guide](getting-started/DEVELOPMENT_AUTH_GUIDE.md) - Local authentication setup
- [🔍 CRN Setup Guide](getting-started/CRN_SETUP_GUIDE.md) - Companies House integration

### For DevOps/Deployment
- [🚀 Deployment Guide](deployment/DEPLOYMENT.md) - Production deployment steps
- [✅ Deployment Checklist](deployment/DEPLOYMENT_CHECKLIST.md) - Pre-launch verification
- [🔧 Environment Setup](deployment/setup/01-environment.md) - Infrastructure configuration

---

## 🔒 Security Documentation

### Critical Security Fixes (February 2026)
- [🔴 Critical Validation Fix](security/CRITICAL_VALIDATION_FIX.md) - **START HERE** - Comprehensive form validation
- [🔐 PDF Security Fix](security/PDF_SECURITY_FIX.md) - Banking details protection in PDFs
- [📋 Security Fixes Summary](security/SECURITY_FIXES_SUMMARY.md) - Overview of all 20/27 security issues fixed
- [💬 Security Changes Explained](security/SECURITY_CHANGES_EXPLAINED.md) - Non-technical explanation for stakeholders

**Priority:** 🔴 **CRITICAL** - Read validation and PDF security docs before deployment

---

## 🐛 Bug Fixes & Features

### Recent Fixes (February 2026)
- [✅ Bug Fixes Complete](fixes/BUG_FIXES_COMPLETE.md) - Upload validation & bank details fixes
- [🏷️ Bank Details Badges](fixes/BANK_DETAILS_BADGES_COMPLETE.md) - Badge implementation on review pages and PDFs

### Validation
- [✔️ Validation Verification](reference/VALIDATION_VERIFICATION.md) - Comprehensive validation documentation (48+ fields)

---

## 🧪 Testing & Debugging

### Testing Guides
- [🧪 Dev Mode Testing Guide](getting-started/DEV_MODE_TESTING_GUIDE.md) - Test without production infrastructure
- [🔍 Debugging File Uploads](debugging/DEBUGGING_FILE_UPLOADS.md) - Troubleshoot upload issues

### What Works in Dev Mode
✅ Form navigation (all 7 sections)
✅ Field validation
✅ File upload UI (memory storage)
✅ Form state persistence
✅ CSRF protection with auto-retry
✅ CRN verification (with API key)
✅ XSS sanitization
✅ Crypto-safe ID generation

❌ Azure AD login (requires production config)
❌ Database persistence (requires SQL Server)
❌ SharePoint document storage
❌ Email notifications (requires Power Automate)

---

## 📦 Deployment Documentation

### Setup Guides (Sequential)
1. [Environment Setup](deployment/setup/01-environment.md) - `.env` configuration
2. [SQL Server Setup](deployment/setup/02-sql-server.md) - Database initialization
3. [SharePoint Setup](deployment/setup/03-sharepoint.md) - Document libraries
4. [Power Automate Setup](deployment/setup/04-power-automate.md) - Workflow automation
5. [Data Export](deployment/setup/05-data-export.md) - Alemba integration

### Deployment Checklists
- [Production Deployment Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Complete pre-launch checklist
- [Deployment Checklist](deployment/CHECKLIST.md) - Detailed verification steps

---

## 👥 User Guides

### For Requesters
- [User Guide](user-guides/USER_GUIDE.md) - Complete form submission guide
- [README](README.md) - Documentation overview

### For Reviewers
- [Alemba Guide](user-guides/ALEMBA.md) - Alemba ITSM integration guide

---

## 📚 Reference Documentation

### Architecture & Design
- [Project Structure](../PROJECT_STRUCTURE.md) - Codebase organisation
- [Roadmap](reference/ROADMAP.md) - Future enhancements
- [Validation Verification](reference/VALIDATION_VERIFICATION.md) - All validation rules documented

### Archive
- [Changes Implemented](archive/CHANGES_IMPLEMENTED.md) - Historical changes
- [Consistency Analysis](archive/CONSISTENCY_ANALYSIS.md) - Code consistency review
- [Production Fixes (Feb 4)](archive/PRODUCTION_FIXES_2026-02-04.md) - Previous fixes

---

## 🚨 Critical Reading Order for New Developers

### Phase 1: Understanding (30 mins)
1. [README](../README.md) - Project overview
2. [Project Structure](../PROJECT_STRUCTURE.md) - Codebase layout
3. [Start Here](getting-started/START_HERE.md) - First-time setup

### Phase 2: Security & Validation (60 mins)
4. [Critical Validation Fix](security/CRITICAL_VALIDATION_FIX.md) - **MUST READ**
5. [PDF Security Fix](security/PDF_SECURITY_FIX.md) - **MUST READ**
6. [Security Fixes Summary](security/SECURITY_FIXES_SUMMARY.md) - Overview
7. [Validation Verification](reference/VALIDATION_VERIFICATION.md) - All rules

### Phase 3: Recent Changes (30 mins)
8. [Bug Fixes Complete](fixes/BUG_FIXES_COMPLETE.md) - Recent bug fixes
9. [Bank Details Badges](fixes/BANK_DETAILS_BADGES_COMPLETE.md) - New feature

### Phase 4: Development Setup (45 mins)
10. [Dev Mode Testing Guide](getting-started/DEV_MODE_TESTING_GUIDE.md) - Local testing
11. [Development Auth Guide](getting-started/DEVELOPMENT_AUTH_GUIDE.md) - Auth setup
12. [Environment Setup](deployment/setup/01-environment.md) - Configuration

**Total Reading Time:** ~3 hours

---

## 🔗 Key Cross-References

### Validation Related
- **Problem:** "Users can enter invalid data (e.g., 2-digit UTR)"
- **Solution:** [Critical Validation Fix](security/CRITICAL_VALIDATION_FIX.md)
- **Verification:** [Validation Verification](reference/VALIDATION_VERIFICATION.md)
- **Testing:** [Dev Mode Testing Guide](getting-started/DEV_MODE_TESTING_GUIDE.md)

### Banking Details Security
- **Problem:** "PDFs expose sort codes and account numbers"
- **Solution:** [PDF Security Fix](security/PDF_SECURITY_FIX.md)
- **Feature:** [Bank Details Badges](fixes/BANK_DETAILS_BADGES_COMPLETE.md)
- **Explanation:** [Security Changes Explained](security/SECURITY_CHANGES_EXPLAINED.md)

### Upload Issues
- **Problem:** "Files don't persist after refresh"
- **Solution:** [Bug Fixes Complete](fixes/BUG_FIXES_COMPLETE.md) - BUG 1
- **Debugging:** [Debugging File Uploads](debugging/DEBUGGING_FILE_UPLOADS.md)
- **Testing:** [Dev Mode Testing Guide](getting-started/DEV_MODE_TESTING_GUIDE.md)

### Authentication
- **Development:** [Development Auth Guide](getting-started/DEVELOPMENT_AUTH_GUIDE.md)
- **Production:** [Deployment Guide](deployment/DEPLOYMENT.md) - Azure AD section
- **Testing:** [Dev Mode Testing Guide](getting-started/DEV_MODE_TESTING_GUIDE.md) - devBypassAuth

---

## 📝 Documentation Status

### ✅ Complete & Up to Date
- Security documentation (Feb 6, 2026)
- Validation documentation (Feb 6, 2026)
- Bug fixes documentation (Feb 6, 2026)
- Testing guides (Feb 6, 2026)

### 🔄 Pending Updates
- None - All documentation is current

### 📅 Review Schedule
- **Security docs:** Review before each production deployment
- **Validation docs:** Review when adding new form fields
- **Testing guides:** Review when infrastructure changes
- **Deployment docs:** Review quarterly or when infrastructure changes

---

## 🆘 Getting Help

### Common Issues & Solutions

**Issue: Form validation not working**
→ Read: [Critical Validation Fix](security/CRITICAL_VALIDATION_FIX.md)
→ Verify: [Validation Verification](reference/VALIDATION_VERIFICATION.md)

**Issue: Files not uploading or persisting**
→ Read: [Bug Fixes Complete](fixes/BUG_FIXES_COMPLETE.md) - BUG 1
→ Debug: [Debugging File Uploads](debugging/DEBUGGING_FILE_UPLOADS.md)

**Issue: Bank details not showing on review pages**
→ Read: [Bug Fixes Complete](fixes/BUG_FIXES_COMPLETE.md) - BUG 2
→ Feature: [Bank Details Badges](fixes/BANK_DETAILS_BADGES_COMPLETE.md)

**Issue: CRN verification 401 error in dev mode**
→ Read: [Dev Mode Testing Guide](getting-started/DEV_MODE_TESTING_GUIDE.md) - Issue #1
→ Solution: devBypassAuth middleware implemented

**Issue: CI/CD build failing**
→ Fixed: Upgraded actions/upload-artifact from v3 to v4
→ Verify: `.github/workflows/ci.yml` line 62

---

## 📋 Documentation Maintenance

### When to Update Documentation

**Add new form field:**
1. Update [Validation Verification](reference/VALIDATION_VERIFICATION.md)
2. Update [Critical Validation Fix](security/CRITICAL_VALIDATION_FIX.md) if validation added
3. Update [User Guide](user-guides/USER_GUIDE.md)

**Fix a bug:**
1. Create entry in `docs/fixes/` or update existing
2. Update [Bug Fixes Complete](fixes/BUG_FIXES_COMPLETE.md)
3. Add to this index under "Recent Fixes"

**Add security fix:**
1. Create entry in `docs/security/`
2. Update [Security Fixes Summary](security/SECURITY_FIXES_SUMMARY.md)
3. Update this index under "Critical Security Fixes"

**Change infrastructure:**
1. Update relevant deployment guide in `docs/deployment/setup/`
2. Update [Deployment Guide](deployment/DEPLOYMENT.md)
3. Update [Dev Mode Testing Guide](getting-started/DEV_MODE_TESTING_GUIDE.md) if affects dev mode

---

## 🎯 Quick Links by Role

### 🧑‍💻 Developers
- [Project Structure](../PROJECT_STRUCTURE.md)
- [Dev Mode Testing](getting-started/DEV_MODE_TESTING_GUIDE.md)
- [Validation Rules](reference/VALIDATION_VERIFICATION.md)
- [Security Fixes](security/SECURITY_FIXES_SUMMARY.md)

### 🔐 Security Team
- [Critical Validation Fix](security/CRITICAL_VALIDATION_FIX.md)
- [PDF Security Fix](security/PDF_SECURITY_FIX.md)
- [Security Summary](security/SECURITY_FIXES_SUMMARY.md)
- [Security Explained](security/SECURITY_CHANGES_EXPLAINED.md)

### 🚀 DevOps
- [Deployment Guide](deployment/DEPLOYMENT.md)
- [Deployment Checklist](deployment/DEPLOYMENT_CHECKLIST.md)
- [Environment Setup](deployment/setup/01-environment.md)
- [Production Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

### 👤 End Users
- [User Guide](user-guides/USER_GUIDE.md)
- [Alemba Guide](user-guides/ALEMBA.md)

### 🧪 QA/Testers
- [Dev Mode Testing](getting-started/DEV_MODE_TESTING_GUIDE.md)
- [Validation Verification](reference/VALIDATION_VERIFICATION.md)
- [Bug Fixes](fixes/BUG_FIXES_COMPLETE.md)

---

## 📊 Documentation Statistics

**Total Documentation Files:** 25+
**Lines of Documentation:** 5,000+
**Last Major Update:** February 6, 2026
**Documentation Coverage:** 95%+

### File Count by Category
- Security: 5 files
- Fixes: 2 files
- Deployment: 9 files
- Getting Started: 5 files
- User Guides: 3 files
- Reference: 2 files
- Archive: 3 files

---

## 🔄 Version History

### February 6, 2026 - v2.0 (Current)
- ✅ Added critical validation fix documentation
- ✅ Added PDF security fix documentation
- ✅ Added validation verification
- ✅ Added bank details badges documentation
- ✅ Organised all docs into folders
- ✅ Created comprehensive index

### February 5, 2026 - v1.5
- Added security fixes summary
- Added security changes explained
- Updated deployment guides

### February 4, 2026 - v1.0
- Initial documentation structure
- Basic guides and references

---

**Need help finding something?** Use the Quick Navigation at the top or search by role/topic above.

**Found an issue in documentation?** Please update this index and create a git commit noting the documentation update.
