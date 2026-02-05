# GitHub Repository Setup Instructions

**Follow these steps to make your repository look professional and clean on GitHub.**

---

## 🎯 Repository Settings (Do This First!)

### 1. Set Repository Description

**Where:** Go to your repository → Click "⚙️" (Settings icon) next to "About" on the right side

**Description to add:**
```
Intelligent NHS supplier onboarding system with automated validation, rejection handling, and RBAC-based approval workflows
```

**Website:** (Optional)
```
https://github.com/f-haque-96/Barts_Health_SSF
```

---

### 2. Add Repository Topics

**Where:** Same "About" section → Click "Add topics"

**Topics to add:** (Click each one)
```
nhs
healthcare
supplier-management
react
nodejs
expressjs
azure-ad
rbac
supplier-onboarding
procurement
form-validation
document-management
```

These topics help people find your project!

---

### 3. Configure Repository Features

**Where:** Repository → Settings → General → Features

**Enable these:**
- ✅ Issues
- ✅ Pull requests
- ✅ Discussions (optional - for community questions)

**Disable these:** (unless you need them)
- ❌ Wiki (you have docs/ folder instead)
- ❌ Projects (unless using GitHub Projects)

---

### 4. Set Default Branch

**Where:** Settings → General → Default branch

**Default branch:** `master` (already set)

---

### 5. Configure Social Preview

**Where:** Settings → General → Social Preview

**Upload an image** (optional but recommended):
- Create a simple banner: 1280x640px
- Include: "NHS Supplier Setup Smart Form" + Barts Health logo
- Upload as social preview image

This image appears when people share your repository link!

---

## 🔐 Security Settings

### 6. Enable Security Features

**Where:** Settings → Security → Code security and analysis

**Enable:**
- ✅ Dependency graph
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Secret scanning alerts (if available)

---

## 📊 Visibility & Access

### 7. Set Repository Visibility

**Where:** Settings → General → Danger Zone → Change visibility

**Options:**
- **Private** - Only you and collaborators can see it (NHS internal)
- **Public** - Anyone can see it (if approved for open source)

**Recommendation:** Keep **Private** for NHS internal use.

---

### 8. Add Collaborators

**Where:** Settings → Collaborators and teams → Add people

**Add team members:**
1. Click "Add people"
2. Enter their GitHub username or email
3. Select role:
   - **Admin** - Full access
   - **Write** - Can push/merge
   - **Read** - View only

---

## 📝 README Enhancements

### 9. The badges are already added!

Your README.md now has:
```markdown
[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)]
[![React](https://img.shields.io/badge/react-19-blue)]
[![Node](https://img.shields.io/badge/node-%3E%3D18-green)]
```

These will show at the top of your GitHub page.

---

## 🏷️ Releases

### 10. Create Your First Release

**Where:** Repository → Releases → Create a new release

**Details:**
- **Tag:** `v2.0.0`
- **Title:** `v2.0 - Production Ready Release`
- **Description:**
  ```
  ## 🎉 Production-Ready Release

  This release includes all critical security fixes and is ready for NHS deployment.

  ### ✨ Key Features
  - Multi-stage approval workflows (PBP, Procurement, OPW, AP Control)
  - Rejection handling with supplier flagging
  - Azure AD authentication with RBAC
  - Companies House integration for CRN verification
  - PDF generation and document management
  - Real-time duplicate detection (fuzzy matching)

  ### 🔒 Security Updates
  - SQL injection protection
  - CSRF protection
  - Server-side validation
  - Audit logging
  - Data encryption

  See [PRODUCTION_FIXES_2026-02-04.md](docs/archive/PRODUCTION_FIXES_2026-02-04.md) for complete details.
  ```

---

## 📌 Pin Important Files

### 11. Use Shields.io for More Badges (Optional)

Add more badges to README.md if desired:

**Code Quality:**
```markdown
[![Maintenance](https://img.shields.io/badge/maintained-yes-green.svg)](https://github.com/f-haque-96/Barts_Health_SSF)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
```

---

## ✅ Checklist

After completing setup, your repository should have:

- [x] Description and topics set
- [x] Security features enabled
- [x] README with badges
- [x] SECURITY.md file
- [x] CONTRIBUTING.md file
- [x] Issue templates
- [x] CODEOWNERS file
- [x] .gitattributes for language detection
- [ ] First release created (do this!)
- [ ] Social preview image (optional)
- [ ] Collaborators added (if team project)

---

## 🎨 Result

After following these steps, your repository will show:

**Top of page:**
- 🏆 Professional badges
- 📝 Clear description
- 🏷️ Relevant topics
- 🔒 Security badge

**Right sidebar:**
- ℹ️ About with description
- 🏷️ Topics (clickable)
- 📦 Releases
- 👥 Contributors

**File list:**
- 📂 Organized folders
- 📄 Important files highlighted
- ✨ Clean commit history

---

## 🆘 Need Help?

If you need help with any of these steps:
1. Check [GitHub Docs](https://docs.github.com/)
2. Ask your IT team
3. Create an issue in the repository

---

**Last Updated:** February 5, 2026
**Estimated Time:** 10-15 minutes
