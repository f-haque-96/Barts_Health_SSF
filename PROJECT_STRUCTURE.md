# Project Structure Guide

**NHS Supplier Setup Smart Form - Complete File & Folder Reference**

This document explains the purpose of every file and folder in this project. Use this as your reference guide to understand where everything is and why.

---

## 📁 Root Directory

```
Barts_Health_SSF/
├── .github/              # GitHub configuration (issue templates, workflows)
├── dist/                 # Production build output (generated, not in Git)
├── docs/                 # All project documentation
├── node_modules/         # Dependencies (generated, not in Git)
├── public/               # Static assets served as-is
├── src/                  # Frontend source code
├── supplier-form-api/    # Backend API
├── .env.example          # Example environment variables template
├── .env.production       # Production environment variables
├── .gitignore            # Files to exclude from Git
├── eslint.config.js      # Code linting rules
├── index.html            # Main HTML entry point
├── package.json          # Project dependencies and scripts
├── package-lock.json     # Locked dependency versions
├── PROJECT_STRUCTURE.md  # This file - explains project organization
├── README.md             # Main project documentation
└── vite.config.js        # Build tool configuration
```

---

## 📂 Detailed Folder Breakdown

### `.github/` - GitHub Configuration

**Purpose:** GitHub-specific files for better project management

```
.github/
├── ISSUE_TEMPLATE/       # Issue templates for bug reports and features
│   ├── bug_report.md
│   └── feature_request.md
└── workflows/            # GitHub Actions CI/CD (future)
```

**What it does:**
- Provides templates when users create issues on GitHub
- Standardizes bug reports and feature requests
- Future: Automated testing and deployment workflows

---

### `docs/` - Documentation Hub

**Purpose:** All project documentation organized by audience

```
docs/
├── getting-started/      # 👈 For new developers
│   ├── START_HERE.md           - Read this first! Complete beginner's guide
│   ├── DEVELOPMENT_MODE_GUIDE.md - Dev environment setup
│   ├── CRN_SETUP_GUIDE.md      - Company lookup configuration
│   └── DEVELOPMENT_AUTH_GUIDE.md - Authentication setup
│
├── deployment/           # 👈 For production deployment
│   ├── CHECKLIST.md            - Deployment checklist (use this!)
│   ├── DEPLOYMENT.md           - Full deployment guide
│   ├── PRODUCTION_DEPLOYMENT_CHECKLIST.md - Alternative checklist
│   └── setup/                  - Step-by-step setup guides
│       ├── 01-environment.md   - Environment variables
│       ├── 02-sql-server.md    - Database setup
│       ├── 03-sharepoint.md    - Document storage setup
│       ├── 04-power-automate.md - Notification workflows
│       └── 05-data-export.md   - Data export configuration
│
├── user-guides/          # 👈 For end users
│   ├── USER_GUIDE.md           - How to use the form
│   └── ALEMBA.md               - Service desk integration
│
├── reference/            # 👈 Technical reference
│   └── ROADMAP.md              - Future features and planning
│
├── archive/              # 👈 Old documentation (kept for reference)
│   ├── PRODUCTION_FIXES_2026-02-04.md - February 2026 security updates
│   ├── CHANGES_IMPLEMENTED.md  - Implementation history
│   └── CONSISTENCY_ANALYSIS.md - Code consistency analysis
│
└── README.md             # Documentation navigation hub
```

**See [docs/README.md](docs/README.md) for the complete documentation guide**

---

### `public/` - Static Assets

**Purpose:** Files served directly without processing

```
public/
├── barts-logo.png        # NHS Barts Health logo (shown in header)
└── vite.svg              # Vite logo (default, can be removed)
```

**What it does:**
- Files in `public/` are copied to `dist/` as-is during build
- Accessible at `/filename` in the browser
- Use for images, fonts, static files that don't need processing

---

### `src/` - Frontend Source Code

**Purpose:** All React application code

```
src/
├── components/           # Reusable React components
│   ├── common/          # Basic UI components (buttons, inputs, etc.)
│   ├── layout/          # Page structure (header, footer, navigation)
│   ├── modals/          # Pop-up dialogs
│   ├── pdf/             # PDF generation components
│   ├── review/          # Review page components
│   └── sections/        # Form sections 1-7
│
├── pages/               # Full page components
│   ├── PBPReviewPage.jsx
│   ├── ProcurementReviewPage.jsx
│   ├── OPWReviewPage.jsx
│   ├── APControlReviewPage.jsx
│   ├── ContractDrafterPage.jsx
│   ├── RequesterResponsePage.jsx
│   ├── HelpPage.jsx
│   └── UnauthorizedPage.jsx
│
├── hooks/               # Custom React hooks
│   ├── useFormNavigation.js
│   └── useCRNVerification.js
│
├── stores/              # State management (Zustand)
│   └── formStore.js     - Central form data store
│
├── context/             # React contexts
│   └── AuthContext.jsx  - Authentication context
│
├── services/            # API communication
│   └── api.js           - API client functions
│
├── utils/               # Helper functions
│   ├── validation.js    - Form validation rules (Zod schemas)
│   ├── helpers.js       - General utility functions
│   ├── formatters.js    - Display formatting
│   ├── companiesHouse.js - Company lookup API
│   └── constants.js     - Constant values
│
├── constants/           # Application constants
│   └── (various)        - Dropdown options, configurations
│
├── config/              # Configuration files
│   └── (various)        - App-specific configuration
│
├── styles/              # CSS files
│   └── variables.css    - CSS custom properties
│
├── assets/              # Images, fonts (imported in code)
│   └── (various)
│
├── App.jsx              # Main application component (routing)
├── App.css              # App component styles
├── main.jsx             # Application entry point
└── index.css            # Global CSS styles
```

**Key Files:**

| File | Purpose |
|------|---------|
| `main.jsx` | **Entry point** - Loads React app into `index.html` |
| `App.jsx` | **Main component** - Defines all routes and page structure |
| `App.css` | **App styles** - Styles for App component |
| `index.css` | **Global styles** - All CSS for the application |

**Folder Purposes:**

| Folder | Contains |
|--------|----------|
| `components/common/` | Buttons, inputs, modals - used everywhere |
| `components/sections/` | Form sections 1-7 - the main form flow |
| `pages/` | Full pages for different user roles |
| `hooks/` | Reusable React logic |
| `stores/` | Global state management |
| `utils/` | Helper functions and validation |

---

### `supplier-form-api/` - Backend API

**Purpose:** Express.js backend for production deployment

```
supplier-form-api/
├── database/             # Database scripts
│   └── schema.sql       - SQL Server database schema
│
├── logs/                # Application logs (generated)
│   ├── app.log          - General application logs
│   └── error.log        - Error logs
│
├── src/                 # Backend source code
│   ├── config/          # Configuration
│   │   ├── database.js  - SQL Server connection
│   │   ├── logger.js    - Winston logging setup
│   │   ├── sharepoint.js - SharePoint client
│   │   └── auth.js      - Azure AD authentication
│   │
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      - Authentication middleware
│   │   ├── rbac.js      - Role-based access control
│   │   ├── audit.js     - Audit logging
│   │   └── validation.js - Request validation
│   │
│   ├── routes/          # API endpoints
│   │   └── index.js     - All API routes defined here
│   │
│   ├── services/        # Business logic
│   │   ├── submissionService.js - Submission CRUD operations
│   │   ├── auditService.js      - Audit logging
│   │   ├── documentService.js   - Document management (DLP)
│   │   └── sharePointService.js - SharePoint integration
│   │
│   ├── utils/           # Utility functions
│   │   └── (various)
│   │
│   └── app.js           # Express app entry point
│
├── .env                 # Local environment variables (not in Git)
├── .env.example         # Environment variable template
├── package.json         # Backend dependencies
└── package-lock.json    # Locked backend dependencies
```

**Key Backend Files:**

| File | Purpose |
|------|---------|
| `src/app.js` | **Express server** - Main backend entry point |
| `src/routes/index.js` | **API routes** - All endpoints defined here |
| `src/config/database.js` | **Database connection** - SQL Server setup |
| `src/config/auth.js` | **Authentication** - Azure AD integration |
| `database/schema.sql` | **Database schema** - SQL Server tables |

---

## 📄 Root Configuration Files

### Package & Dependency Files

| File | Purpose | Can I Delete? |
|------|---------|---------------|
| `package.json` | Lists all dependencies and npm scripts | ❌ No - Required |
| `package-lock.json` | Locks exact dependency versions | ❌ No - Required |

### Build & Tool Configuration

| File | Purpose | Can I Delete? |
|------|---------|---------------|
| `vite.config.js` | Build tool configuration | ❌ No - Required for build |
| `eslint.config.js` | Code linting rules | ⚠️ Optional - But recommended |
| `index.html` | HTML entry point | ❌ No - App won't load |

### Environment Configuration

| File | Purpose | Can I Delete? |
|------|---------|---------------|
| `.env.example` | Template for environment variables | ⚠️ Keep - Helps others set up |
| `.env.production` | Production environment variables | ⚠️ Keep - Needed for deployment |
| `.gitignore` | Files Git should ignore | ❌ No - Protects secrets |

### Documentation Files

| File | Purpose | Can I Delete? |
|------|---------|---------------|
| `README.md` | Main project documentation | ❌ No - First thing people see |
| `PROJECT_STRUCTURE.md` | This file - explains organization | ⚠️ Keep - Very helpful |

---

## 🎯 Where to Find Things

| I Want To... | Go To... |
|-------------|----------|
| **Start developing** | [docs/getting-started/START_HERE.md](docs/getting-started/START_HERE.md) |
| **Deploy to production** | [docs/deployment/CHECKLIST.md](docs/deployment/CHECKLIST.md) |
| **Understand a component** | [src/components/](src/components/) |
| **Change form validation** | [src/utils/validation.js](src/utils/validation.js) |
| **Modify API endpoints** | [supplier-form-api/src/routes/index.js](supplier-form-api/src/routes/index.js) |
| **Change database schema** | [supplier-form-api/database/schema.sql](supplier-form-api/database/schema.sql) |
| **Update styling** | [src/index.css](src/index.css) or component-specific CSS files |
| **Add a new page** | Create in [src/pages/](src/pages/) and add route in [src/App.jsx](src/App.jsx) |
| **Add a new form section** | Create in [src/components/sections/](src/components/sections/) |
| **Report a bug** | Use GitHub Issues with [bug_report template](.github/ISSUE_TEMPLATE/bug_report.md) |

---

## 🚫 What NOT to Commit to Git

These files/folders are automatically ignored (see `.gitignore`):

- `node_modules/` - Dependencies (npm install recreates)
- `dist/` - Build output (npm run build recreates)
- `.env` - Local environment variables (contains secrets!)
- `logs/` - Application logs (regenerated)
- `.DS_Store` - macOS system files
- `*.log` - Log files
- `coverage/` - Test coverage reports (if added)

---

## 🔧 Common Tasks

### Adding a New Component
1. Create file in `src/components/common/` or appropriate subfolder
2. Export from `src/components/common/index.js`
3. Import where needed: `import { MyComponent } from '../common'`

### Adding a New Page
1. Create file in `src/pages/MyNewPage.jsx`
2. Add route in `src/App.jsx`:
   ```jsx
   <Route path="/my-page" element={<MyNewPage />} />
   ```

### Adding a New API Endpoint
1. Add route in `supplier-form-api/src/routes/index.js`
2. Create service function in `supplier-form-api/src/services/`
3. Add any middleware needed

### Updating Documentation
1. Main docs: Edit files in `docs/`
2. Project overview: Update [README.md](README.md)
3. Structure changes: Update this file ([PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md))

---

## 📊 Project Statistics

- **Total Folders:** ~25 major folders
- **Frontend Components:** 70+ React components
- **Backend Services:** 4 main service files
- **Documentation Files:** 15+ guides
- **Lines of Code:** ~15,000+ (estimated)

---

## 🆘 Need Help?

1. **Understanding the project:** Read [README.md](README.md)
2. **Getting started:** Read [docs/getting-started/START_HERE.md](docs/getting-started/START_HERE.md)
3. **Finding documentation:** Check [docs/README.md](docs/README.md)
4. **Specific questions:** Ask your team or create a GitHub issue

---

**Last Updated:** February 5, 2026
**Maintained By:** NHS Barts Health Development Team
