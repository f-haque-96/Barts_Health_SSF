# NHS Supplier Setup Smart Form

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)](https://github.com/f-haque-96/Barts_Health_SSF)
[![React](https://img.shields.io/badge/react-19-blue)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-NHS%20Internal-blue)](LICENSE)

> **NHS Barts Health Trust** - Intelligent supplier onboarding system with automated validation, rejection handling, and multi-stage approval workflows.

A comprehensive React-based web application for NHS supplier onboarding and setup. This form collects supplier information, validates company details against Companies House, implements fraud prevention, and routes submissions through various authorization workflows with role-based access control.

## 🔒 Security Updates (February 2026)

**This project is now production-ready with critical security enhancements:**

✅ **All critical vulnerabilities fixed** (SQL injection, CSRF protection, file validation)
✅ **Enhanced data protection** (encryption, audit logging, GDPR compliance)
✅ **Automatic duplicate detection** (prevents fraud)
✅ **Server-side validation** (protects against malicious input)
✅ **Test features secured** (automatic in dev, never in production)

**For complete details of all security fixes, see:** [docs/archive/PRODUCTION_FIXES_2026-02-04.md](./docs/archive/PRODUCTION_FIXES_2026-02-04.md)

---

## Table of Contents

- [Overview](#overview)
- [Rejection Handling System](#rejection-handling-system)
- [Can Anyone Download and Run This?](#can-anyone-download-and-run-this)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Detailed File Descriptions](#detailed-file-descriptions)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Further Documentation](#further-documentation)

---

## Overview

This application provides:

- **7-section supplier form** - Collects requester info, pre-screening, supplier classification, company details, service description, financial info, and review/submit
- **Companies House integration** - Verifies Company Registration Numbers (CRN) against the official API
- **Multiple authorization workflows** - Routes submissions to AP Control, Procurement, OPW Panel, or PBP based on criteria
- **PDF generation** - Creates downloadable PDF summaries of submissions
- **File upload support** - Handles document uploads (letterheads, ID verification, etc.)
- **Rejection handling system** - Automatically flags rejected suppliers, displays rejection notices to requesters, prevents resubmission of rejected suppliers with fuzzy matching (70% similarity threshold)

---

## Rejection Handling System

The application includes a comprehensive rejection handling system that protects against resubmission of rejected suppliers:

### How It Works

1. **Rejection Detection**: When any reviewer (PBP, Procurement, OPW Panel, or AP Control) rejects a submission, the system:
   - Records rejection details (reviewer, role, reason, date)
   - Flags the supplier in the system
   - Displays a rejection notice to the requester

2. **Rejection Banner**: When a requester logs in after their submission is rejected, they see:
   - **Rejection details**: Who rejected it, when, and why
   - **Flagging warning**: Supplier is flagged and will be detected if resubmitted
   - **Action buttons**:
     - **PBP rejections**: "View Full Details" + "Submit Another Supplier"
     - **Procurement/OPW/AP rejections**: "Submit Another Supplier" only

3. **Real-Time Duplicate Detection**: As users type a company name in Section 4:
   - System checks against all previously rejected suppliers
   - Uses fuzzy matching algorithm (70% similarity threshold)
   - Displays warning if similar name detected
   - Shows: similarity percentage, original rejected supplier name, rejection details

4. **Form Lock on Rejection**: If a user dismisses the rejection banner:
   - Section 2 displays rejection message in place of "Awaiting PBP Approval"
   - Form is locked with custom navigation buttons
   - User can either view full details (PBP only) or submit a new supplier

### Benefits

- **Prevents fraud**: Users cannot simply rename a rejected supplier
- **Increases transparency**: Requesters know exactly why their submission was rejected
- **Improves data quality**: Reduces duplicate submissions and resubmission attempts
- **Compliance**: Full audit trail of all rejected suppliers

---

## Can Anyone Download and Run This?

**Yes!** Anyone with a computer can download and run this project locally. Here's what you need:

**📖 Complete Beginner?** Don't worry! This section explains everything step-by-step. You don't need to be a programmer.

### Requirements

| Requirement | Details | Do I Need This? |
|-------------|---------|-----------------|
| **Node.js** | Version 18 or higher - Download free from [nodejs.org](https://nodejs.org/) | ✅ Yes - This is what runs the application |
| **A code editor** | Optional but recommended - [VS Code](https://code.visualstudio.com/) is free | ⚠️ Optional - Only if you want to view/edit code |
| **Internet connection** | For initial setup (downloading packages) | ✅ Yes - Only once during setup |
| **A modern web browser** | Chrome, Edge, Firefox, or Safari | ✅ Yes - To view the form |

### Steps to Run

```bash
# 1. Download/clone the project from GitHub
git clone https://github.com/f-haque-96/Barts_Health_SSF.git

# 2. Open terminal/command prompt in the project folder
cd Barts_Health_SSF

# 3. Install dependencies (downloads all required packages)
npm install

# 4. Create your local environment file
# Windows Command Prompt:
copy .env.example .env.local
# Windows PowerShell / Mac / Linux:
cp .env.example .env.local

# 5. Start the development server
npm run dev

# 6. Open browser to http://localhost:5173
```

**That's it!** The form will run on your laptop without needing any server or database.

### What Works Without a Backend?

**"Backend" = The server part that stores data in a database. "Frontend" = The form you see and fill out.**

| Feature | Works Locally? | Explanation |
|---------|---------------|-------------|
| Viewing and filling out the form | ✅ Yes | The form displays and you can type in it |
| Navigation between sections | ✅ Yes | Moving between Section 1-7 works |
| Form validation | ✅ Yes | Error messages if you enter invalid data |
| PDF generation and download | ✅ Yes | Can download a PDF of your submission |
| Saving progress (localStorage) | ✅ Yes | Data saves in your browser automatically |
| **Security features (Feb 2026)** | ✅ Partial | Basic validation works; advanced features need backend |
| CRN verification | ❌ No | Needs backend API to check Companies House |
| Form submission to database | ❌ No | Uses mock (localStorage) instead of real database |
| Duplicate detection | ❌ No | Needs backend and database |
| Audit logging | ❌ No | Needs backend to record actions |

**In simple terms:** You can see and test the form on your laptop, but the security features and database connections only work when fully deployed with the backend.

---

## Quick Start

```bash
npm install        # Install dependencies
npm run dev        # Start development server (http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## Project Structure

**📖 Complete Structure Guide:** [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

The project is organized into clear folders:

```
Barts_Health_SSF/
├── .github/              # GitHub templates (issue/PR templates)
├── docs/                 # 📚 All documentation (organized by purpose)
│   ├── getting-started/  # For new developers
│   ├── deployment/       # For production deployment
│   ├── user-guides/      # For end users
│   ├── reference/        # Technical reference
│   └── archive/          # Old docs (kept for reference)
│
├── public/               # Static assets (served as-is)
├── src/                  # 💻 Frontend source code (React)
│   ├── components/       # Reusable React components
│   ├── pages/            # Full page components
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # State management (Zustand)
│   ├── utils/            # Helper functions & validation
│   └── ...
│
├── supplier-form-api/    # 🖥️ Backend API (Express.js)
│   ├── database/         # SQL schema scripts
│   ├── src/              # Backend source code
│   │   ├── config/       # Database, auth, SharePoint config
│   │   ├── middleware/   # Auth, RBAC, audit
│   │   ├── routes/       # API endpoints
│   │   └── services/     # Business logic
│   └── ...
│
├── src/                        # Frontend source code (React)
│   ├── components/            # Reusable React components
│   │   ├── common/            # Basic UI components (buttons, inputs, etc.)
│   │   ├── layout/            # Page structure components
│   │   ├── modals/            # Pop-up dialog components
│   │   ├── pdf/               # PDF document generators
│   │   ├── review/            # Review page components
│   │   └── sections/          # Form sections 1-7
│   │
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Full page components (review pages)
│   ├── stores/                # State management (Zustand)
│   ├── styles/                # CSS variables and themes
│   ├── utils/                 # Helper functions and utilities
│   │
│   ├── App.jsx                # Main application component (routing)
│   ├── App.css                # Global app styles
│   ├── main.jsx               # Application entry point
│   └── index.css              # Global CSS styles
│
├── dist/                       # Production build output (generated)
│
├── .env.example               # Template for environment variables
├── .env.production            # Production environment settings
├── .gitignore                 # Files to exclude from Git
├── DEPLOYMENT_GUIDE.md        # Detailed deployment instructions
├── eslint.config.js           # Code linting rules
├── index.html                 # HTML entry point
├── package.json               # Project dependencies and scripts
├── package-lock.json          # Locked dependency versions
├── README.md                  # This file
└── vite.config.js             # Build tool configuration
```

---

## Detailed File Descriptions

### Root Files

| File | Purpose |
|------|---------|
| `index.html` | The single HTML page that loads the React app. Contains the `<div id="root">` where React renders. |
| `package.json` | Lists all project dependencies (React, etc.) and defines npm scripts like `dev`, `build`. |
| `package-lock.json` | Locks exact versions of dependencies for consistent installs across machines. |
| `vite.config.js` | Configuration for Vite (the build tool). Defines plugins and build settings. |
| `eslint.config.js` | Rules for code quality checking. Catches common errors and enforces style. |
| `.gitignore` | Lists files/folders Git should ignore (node_modules, .env files, etc.). |
| `.env.example` | Template showing what environment variables are needed. Copy to `.env.local`. |
| `.env.production` | Environment variables for production deployment. |
| `docs/` | Documentation folder (deployment, checklist, guides). |
| `supplier-form-api/` | Backend API (Express.js with Azure AD auth). |
| `README.md` | This documentation file. |

---

### src/ - Source Code

#### Entry Points

| File | Purpose |
|------|---------|
| `main.jsx` | **Application entry point.** Renders the React app into the HTML page. Sets up React Router for navigation. |
| `App.jsx` | **Main component.** Defines all the routes (URLs) and which page/component to show for each. |
| `App.css` | Styles specific to the App component. |
| `index.css` | **Global styles.** Contains all CSS for the entire application - buttons, forms, colors, spacing, etc. |

---

### src/components/ - Reusable Components

#### src/components/common/ - Basic UI Components

These are the building blocks used throughout the application.

| File | Purpose |
|------|---------|
| `index.js` | **Exports all common components.** Allows importing multiple components in one line. |
| `Button.jsx` | Reusable button component with different styles (primary, secondary, danger). |
| `Input.jsx` | Text input field with label, validation, and error display. |
| `Textarea.jsx` | Multi-line text input for longer responses. |
| `Checkbox.jsx` | Checkbox input with label styling. |
| `RadioGroup.jsx` | Group of radio buttons for single-choice questions. |
| `Select.jsx` | Dropdown select menu component. |
| `FileUpload.jsx` | Drag-and-drop file upload component with preview. |
| `NoticeBox.jsx` | Colored alert/notice boxes (info, warning, success, error). |
| `Modal.jsx` | Pop-up dialog overlay component. |
| `Tooltip.jsx` | Hover tooltip for additional information. |
| `Icons.jsx` | **SVG icon components.** Contains CheckIcon, XIcon, WarningIcon, etc. |
| `QuestionLabel.jsx` | Formatted label showing section and question number (e.g., "2.1"). |
| `SignatureSection.jsx` | Digital signature capture component. |
| `ApprovalStamp.jsx` | Visual stamp showing approval/rejection status. |
| `HelpButton.jsx` | Help icon button that opens guidance. |
| `HelpButton.css` | Styles for help button. |
| `SupplierTypeIcons.jsx` | Icons representing different supplier types. |

---

#### src/components/layout/ - Page Structure

| File | Purpose |
|------|---------|
| `index.js` | Exports all layout components. |
| `Header.jsx` | **Page header.** Shows NHS logo and form title at top of every page. |
| `Footer.jsx` | **Page footer.** Shows copyright and links at bottom. |
| `FormNavigation.jsx` | **Next/Previous buttons.** Navigation between form sections with validation. |
| `ProgressIndicator.jsx` | **Progress bar.** Shows which section user is on (1-7) with visual progress. |

---

#### src/components/sections/ - Form Sections

The main form is divided into 7 sections. Each file handles one section.

| File | Purpose |
|------|---------|
| `Section1RequesterInfo.jsx` | **Section 1: Requester Information.** Collects NHS staff name, email, department. |
| `Section2PreScreening.jsx` | **Section 2: Pre-Screening.** Determines if supplier setup is appropriate, checks for conflicts of interest. |
| `Section3Classification.jsx` | **Section 3: Supplier Classification.** Collects supplier type (Limited Company, Charity, Sole Trader, Public Sector), CRN verification. |
| `Section4SupplierDetails.jsx` | **Section 4: Supplier Details.** Company name, address, contact information. |
| `Section5ServiceDescription.jsx` | **Section 5: Service Description.** What goods/services the supplier provides. |
| `Section6FinancialInfo.jsx` | **Section 6: Financial Information.** Bank details, payment terms, contract value. |
| `Section7ReviewSubmit.jsx` | **Section 7: Review & Submit.** Shows summary of all entered data, final confirmation, and submit button. Also contains test buttons for authorization previews. |

---

#### src/components/modals/ - Dialog Windows

| File | Purpose |
|------|---------|
| `QuestionnaireModal.jsx` | Pop-up questionnaire for additional screening questions. |
| `RejectionBanner.jsx` | **Rejection notice modal.** Displays when a submission is rejected by PBP/Procurement/OPW/AP Control. Shows rejection details, flags supplier, provides "Submit Another Supplier" button. |
| `RejectionBanner.css` | Styles for rejection banner modal. |

---

#### src/components/pdf/ - PDF Generation

| File | Purpose |
|------|---------|
| `SupplierFormPDF.jsx` | **Generates PDF document.** Creates a downloadable PDF summary of the submitted form using react-pdf library. |
| `PBPApprovalPDF.jsx` | Generates PDF for Pre-Buy Panel approval documentation. |

---

#### src/components/review/ - Review Components

| File | Purpose |
|------|---------|
| `UploadedDocuments.jsx` | Displays list of uploaded documents with download/preview links. |

---

### src/pages/ - Full Page Components

These are complete pages shown after form submission for different authorization workflows.

| File | Purpose |
|------|---------|
| `APControlReviewPage.jsx` | **AP Control Review.** Page for Accounts Payable team to verify bank details and approve supplier setup. |
| `ProcurementReviewPage.jsx` | **Procurement Review.** Page for procurement team to review and approve supplier requests. |
| `OPWReviewPage.jsx` | **OPW Panel Review.** Off-Payroll Working panel page for IR35 determination (sole traders). |
| `PBPReviewPage.jsx` | **Pre-Buy Panel Review.** Page for high-value purchases requiring panel approval. |
| `RequesterResponsePage.jsx` | Page showing the requester the status of their submission. |
| `ContractDrafterPage.jsx` | Page for contract drafting workflow. |
| `ContractDrafterPage.css` | Styles for contract drafter page. |
| `HelpPage.jsx` | Help and guidance page with FAQs. |
| `HelpPage.css` | Styles for help page. |

---

### src/hooks/ - Custom React Hooks

Hooks are reusable logic that can be shared across components.

| File | Purpose |
|------|---------|
| `useFormNavigation.js` | **Navigation logic.** Handles moving between form sections, validation before proceeding. |
| `useCRNVerification.js` | **CRN verification logic.** Manages the API call to verify Company Registration Numbers. |

---

### src/stores/ - State Management

| File | Purpose |
|------|---------|
| `formStore.js` | **Central data store.** Uses Zustand to manage all form data across sections. Handles saving to localStorage, validation status, and data persistence. |

---

### src/utils/ - Helper Functions

| File | Purpose |
|------|---------|
| `validation.js` | **Form validation rules.** Defines what fields are required, format rules (email, phone), using Zod library. |
| `helpers.js` | **General helper functions.** Date formatting, currency formatting, postcode formatting, etc. |
| `formatters.js` | **Display formatters.** Converts stored values to display format (e.g., `sole_trader` → `SOLE TRADER`). |
| `companiesHouse.js` | **Companies House API.** Functions to search and verify company registration numbers. |
| `constants.js` | **Constant values.** Dropdown options, configuration values that don't change. |

---

### src/styles/ - Styling

| File | Purpose |
|------|---------|
| `variables.css` | **CSS custom properties.** Defines colors, spacing, fonts used throughout the app for consistent styling. |

---

### src/assets/ - Static Assets

| File | Purpose |
|------|---------|
| (various) | Images, fonts, and other static files used in the application. |

---

## Available Scripts

Run these commands in the project folder:

| Command | What it does |
|---------|--------------|
| `npm install` | Downloads all required packages (run once after cloning) |
| `npm run dev` | Starts development server at http://localhost:5173 |
| `npm run build` | Creates production-ready files in `dist/` folder |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Check code for errors and style issues |

---

## Environment Variables

Create a `.env.local` file (copy from `.env.example`) with these variables:

```env
# Backend API URL (for CRN verification and form submission)
VITE_API_URL=http://localhost:7071/api

# Show test authorization buttons (set to 'false' for production)
VITE_ENABLE_TEST_BUTTONS=true

# NHS Intranet URL (optional)
VITE_INTRANET_URL=https://intranet.nhs.uk
```

---

## 📚 Documentation

**📍 Complete Documentation Index:** [docs/README.md](./docs/README.md)

### 🎓 For Beginners (Start Here!)

**New to the project?** Read these guides in order:

| Document | Purpose | Read This If... |
|----------|---------|-----------------|
| **[docs/getting-started/START_HERE.md](./docs/getting-started/START_HERE.md)** 👈 | **Complete beginner's guide** | **This is your first time** |
| [docs/getting-started/DEVELOPMENT_MODE_GUIDE.md](./docs/getting-started/DEVELOPMENT_MODE_GUIDE.md) | How development vs production works | You want to develop locally |
| [docs/getting-started/CRN_SETUP_GUIDE.md](./docs/getting-started/CRN_SETUP_GUIDE.md) | Company lookup setup | You want to test or set up CRN verification |

### 🚀 For Deployment

| Document | Purpose | Read This If... |
|----------|---------|-----------------|
| [docs/deployment/CHECKLIST.md](./docs/deployment/CHECKLIST.md) | Complete deployment checklist | You're deploying to production |
| [docs/deployment/DEPLOYMENT.md](./docs/deployment/DEPLOYMENT.md) | Detailed deployment guide | You need step-by-step deployment instructions |
| [docs/deployment/setup/](./docs/deployment/setup/) | Step-by-step setup guides | You need to set up SQL, SharePoint, Power Automate |

### 📖 For Users & Administrators

| Document | Purpose | Read This If... |
|----------|---------|-----------------|
| [docs/user-guides/USER_GUIDE.md](./docs/user-guides/USER_GUIDE.md) | How to use the form | You're a requester or reviewer |
| [docs/user-guides/ALEMBA.md](./docs/user-guides/ALEMBA.md) | Alemba ITSM integration | You're integrating with service desk |

### 🔧 Technical Documentation

| Document | Purpose | Read This If... |
|----------|---------|-----------------|
| [docs/archive/PRODUCTION_FIXES_2026-02-04.md](./docs/archive/PRODUCTION_FIXES_2026-02-04.md) | February 2026 security updates | You want to know what was fixed |
| [docs/reference/ROADMAP.md](./docs/reference/ROADMAP.md) | Future features and planning | You want to see what's coming next |

### 🌐 External Documentation

- **[Vite Documentation](https://vitejs.dev/)** - Build tool documentation
- **[React Documentation](https://react.dev/)** - React framework documentation

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI framework |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [React Router](https://reactrouter.com/) | Page navigation |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management |
| [React Hook Form](https://react-hook-form.com/) | Form handling |
| [Zod](https://zod.dev/) | Validation |
| [React PDF](https://react-pdf.org/) | PDF generation |

---

## Support

For issues or questions:
- **Technical issues:** Raise an issue on [GitHub](https://github.com/f-haque-96/Barts_Health_SSF/issues)
- **Security concerns:** Contact the development team directly
- **General questions:** See [docs/user-guides/USER_GUIDE.md](./docs/user-guides/USER_GUIDE.md) FAQ section

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | February 2026 | **Major security update** - Fixed all critical vulnerabilities, added CSRF protection, server-side validation, duplicate detection. See [docs/archive/CHANGES_IMPLEMENTED.md](./docs/archive/CHANGES_IMPLEMENTED.md) |
| 1.0 | January 2026 | Initial release with core functionality |

---

*Last updated: February 4, 2026*
*Project Status: ✅ Production Ready (all security fixes implemented)*
