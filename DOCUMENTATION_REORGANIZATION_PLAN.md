# Documentation Reorganization Plan

**Date:** February 5, 2026
**Purpose:** Consolidate, organize, and optimize project documentation for clarity and maintainability

---

## Current State Analysis

### Documentation Locations

```
Root Level:
├── README.md (keep - entry point)
├── PRODUCTION_DEPLOYMENT_CHECKLIST.md (move to docs/)
├── PRODUCTION_FIXES_2026-02-04.md (move to docs/)
└── CHANGES_IMPLEMENTED.md (archive to docs/archive/)

docs/:
├── START_HERE.md ✅ (perfect location)
├── DEVELOPMENT_MODE_GUIDE.md ✅ (perfect location)
├── CRN_SETUP_GUIDE.md ✅ (perfect location)
├── USER_GUIDE.md ✅ (perfect location)
├── DEPLOYMENT.md ⚠️ (overlaps with PRODUCTION_DEPLOYMENT_CHECKLIST.md)
├── CHECKLIST.md ⚠️ (overlaps with DEPLOYMENT.md)
├── ALEMBA.md ✅ (perfect location)
├── ROADMAP.md ⚠️ (consider moving to docs/planning/)
└── CONSISTENCY_ANALYSIS.md ⚠️ (technical doc - move to docs/technical/)

next-steps/:
├── README.md ✅
├── 00-ENVIRONMENT-SETUP.md ✅
├── 01-SQL-SERVER-SETUP.md ✅
├── 02-SHAREPOINT-LIBRARIES-SETUP.md ✅
├── 03-SUPPLIER-DATA-EXPORT.md ✅
└── 04-POWER-AUTOMATE-SETUP.md ✅
```

---

## Reorganization Plan

### Phase 1: Create New Folder Structure

```
docs/
├── guides/              (User-facing guides - beginner-friendly)
│   ├── START_HERE.md
│   ├── DEVELOPMENT_MODE_GUIDE.md
│   ├── CRN_SETUP_GUIDE.md
│   └── USER_GUIDE.md
│
├── deployment/          (Deployment and production guides)
│   ├── PRODUCTION_DEPLOYMENT_CHECKLIST.md (from root)
│   ├── DEPLOYMENT.md (consolidated)
│   └── CHECKLIST.md (deprecated - merged into DEPLOYMENT.md)
│
├── integration/         (Third-party integration guides)
│   └── ALEMBA.md
│
├── technical/           (Technical analysis and planning)
│   ├── CONSISTENCY_ANALYSIS.md
│   ├── ROADMAP.md
│   └── PRODUCTION_FIXES_2026-02-04.md (from root)
│
└── archive/             (Historical documents)
    └── CHANGES_IMPLEMENTED.md (from root)
```

---

## Phase 2: Consolidation Tasks

### Task 1: Merge CHECKLIST.md into DEPLOYMENT.md

**Rationale:** Both documents serve similar purposes (deployment preparation)

**Action:**
1. Take SESSION_SECRET generation methods from CHECKLIST.md
2. Merge into DEPLOYMENT.md as "Session Secret Generation (3 Methods)"
3. Add CSRF integration examples from CHECKLIST.md to DEPLOYMENT.md
4. Create single comprehensive deployment guide
5. Deprecate CHECKLIST.md (add redirect at top)

**Result:** One authoritative deployment guide instead of two overlapping ones

---

### Task 2: Create Documentation Index

**File:** `docs/README.md` (new file)

**Content:**
```markdown
# NHS Supplier Setup Smart Form - Documentation Index

## 🚀 Getting Started (Start Here!)

**New to the project?** Start with these guides in order:

1. [START_HERE.md](guides/START_HERE.md) - Complete beginner's guide
2. [DEVELOPMENT_MODE_GUIDE.md](guides/DEVELOPMENT_MODE_GUIDE.md) - How development works
3. [CRN_SETUP_GUIDE.md](guides/CRN_SETUP_GUIDE.md) - Company lookup setup

## 📚 User Guides

- [USER_GUIDE.md](guides/USER_GUIDE.md) - For end users (requesters, reviewers)
- [DEVELOPMENT_MODE_GUIDE.md](guides/DEVELOPMENT_MODE_GUIDE.md) - For developers

## 🚀 Deployment Guides

- [PRODUCTION_DEPLOYMENT_CHECKLIST.md](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Complete deployment checklist
- [DEPLOYMENT.md](deployment/DEPLOYMENT.md) - Detailed deployment guide
- [../next-steps/](../next-steps/) - Step-by-step setup guides

## 🔌 Integration Guides

- [ALEMBA.md](integration/ALEMBA.md) - Alemba ITSM integration guide

## 🔧 Technical Documentation

- [CONSISTENCY_ANALYSIS.md](technical/CONSISTENCY_ANALYSIS.md) - Project consistency analysis
- [ROADMAP.md](technical/ROADMAP.md) - Product roadmap and future features
- [PRODUCTION_FIXES_2026-02-04.md](technical/PRODUCTION_FIXES_2026-02-04.md) - February 2026 security updates

## 📦 Next Steps Guides (Deployment Setup)

See [../next-steps/README.md](../next-steps/README.md) for step-by-step deployment setup:

1. Environment Setup
2. SQL Server Setup
3. SharePoint Libraries Setup
4. Supplier Data Export Configuration
5. Power Automate Setup

## 📁 Archive

Historical documents and deprecated files: [archive/](archive/)
```

---

### Task 3: Update Cross-References

**After reorganization, update all internal links:**

| File | Old Link | New Link |
|------|----------|----------|
| START_HERE.md | `PRODUCTION_DEPLOYMENT_CHECKLIST.md` | `deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md` |
| START_HERE.md | `PRODUCTION_FIXES_2026-02-04.md` | `technical/PRODUCTION_FIXES_2026-02-04.md` |
| DEPLOYMENT.md | `CHECKLIST.md` | (remove - merged content) |
| All files | Update relative paths after folder changes | Update to new structure |

---

## Phase 3: Update README.md

**Root README.md should point to documentation:**

Add section after project description:

```markdown
## 📚 Documentation

**New to the project?**
- Start here: [docs/guides/START_HERE.md](docs/guides/START_HERE.md)
- Documentation index: [docs/README.md](docs/README.md)

**Ready to deploy?**
- Deployment checklist: [docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- Next steps guides: [next-steps/README.md](next-steps/README.md)
```

---

## Phase 4: Deprecation Strategy

### CHECKLIST.md Deprecation

**Add to top of CHECKLIST.md (before moving to archive):**

```markdown
# ⚠️ DEPRECATED - This Document Has Been Merged

**This checklist has been merged into [DEPLOYMENT.md](DEPLOYMENT.md) for easier maintenance.**

**Please use:** [DEPLOYMENT.md](DEPLOYMENT.md) instead.

**This file will be removed in a future update.**

---

[Original content below for reference]
```

### CHANGES_IMPLEMENTED.md Archival

**Add to top before archiving:**

```markdown
# ARCHIVED - Historical Reference Only

**This document is archived.** For current changes, see:
- [PRODUCTION_FIXES_2026-02-04.md](../technical/PRODUCTION_FIXES_2026-02-04.md) - February 2026 updates
- [ROADMAP.md](../technical/ROADMAP.md) - Future changes

---

[Original content below for reference]
```

---

## Benefits of Reorganization

### ✅ For Beginners
- Clear starting point (START_HERE.md)
- Guides organized by purpose (guides/, deployment/, etc.)
- No confusion about which document to read

### ✅ For Developers
- Technical docs separated from user guides
- Easy to find what you need
- Logical folder structure

### ✅ For Deployment Team
- All deployment docs in one place
- Single authoritative source (no CHECKLIST.md vs DEPLOYMENT.md confusion)
- Clear next-steps progression

### ✅ For Maintenance
- Less duplication (SESSION_SECRET only in one place)
- Easier to update (change once, not in multiple files)
- Clear ownership of each document type

---

## Implementation Steps

1. ✅ Create folder structure
2. ✅ Move files to new locations
3. ✅ Merge CHECKLIST.md into DEPLOYMENT.md
4. ✅ Create docs/README.md index
5. ✅ Update all cross-references
6. ✅ Add deprecation notices
7. ✅ Update root README.md
8. ✅ Test all links
9. ✅ Commit and push

---

## Approval Required?

**Question for user:** Should I proceed with this reorganization, or would you prefer a different structure?

**Alternative simpler approach:** Keep current structure but just merge CHECKLIST.md into DEPLOYMENT.md and move root-level docs to docs/ folder.

---

**Status:** DRAFT - Awaiting approval
**Next Step:** User approval to proceed or request modifications
