# Step 0: Environment Variables Setup (CRITICAL)

## Beginner's Guide - Read Everything Carefully

**Estimated Time:** 15-20 minutes
**Difficulty:** Easy
**When To Do This:** Before deploying the backend API

---

## ⚠️ IMPORTANT: Why This Step Exists (February 2026)

The backend API has been updated with critical security fixes that require proper environment configuration. **The API will NOT start** if required variables are missing.

**New Security Features:**
- CSRF protection (requires SESSION_SECRET)
- Server-side validation
- Enhanced authentication
- Environment validation on startup

---

## What Are Environment Variables?

Think of environment variables like a **settings file** for your application. They store:
- Database passwords
- API keys
- Security secrets
- Configuration settings

**Why not put these in code?**
- Security: Passwords shouldn't be in code files
- Flexibility: Different settings for development vs production
- Safety: Can't accidentally share secrets on GitHub

---

## Part A: Understanding the .env File

### What Is a .env File?

It's a **text file** that looks like this:

```
DB_HOST=myserver.database.windows.net
DB_PASSWORD=MySecurePassword123
SESSION_SECRET=abc123def456...
```

Each line is a variable with a value.

### Where Does It Go?

```
your-project-folder/
├── supplier-form-api/
│   ├── .env  ← CREATE THIS FILE HERE
│   ├── .env.example  ← TEMPLATE (don't edit this one)
│   └── src/
```

---

## Part B: Required vs Optional Variables

### ✅ REQUIRED Variables (API won't start without these)

These are **non-negotiable**. The API checks for them on startup and exits if any are missing.

| Variable | What It's For | Where To Get It |
|----------|---------------|-----------------|
| `DB_HOST` | Database server address | IT or SQL Server setup |
| `DB_NAME` | Database name (NHSSupplierForms) | Your SQL Server setup |
| `DB_USER` | Database username | Your SQL Server setup |
| `DB_PASSWORD` | Database password | Your SQL Server setup |
| `AZURE_AD_CLIENT_ID` | Azure AD app ID | IT (from Azure portal) |
| `AZURE_AD_TENANT_ID` | Azure AD tenant ID | IT (from Azure portal) |
| `SP_SITE_URL` | SharePoint site URL | Your SharePoint setup |
| `SP_CLIENT_ID` | SharePoint app ID | IT (from app registration) |
| `SP_CLIENT_SECRET` | SharePoint app secret | IT (from app registration) |
| `SESSION_SECRET` | **⚠️ YOU MUST GENERATE THIS** | See Part C below |

### 🔵 OPTIONAL Variables (have defaults)

| Variable | What It's For | Default Value |
|----------|---------------|---------------|
| `NODE_ENV` | Environment type | development |
| `API_PORT` | Port number | 3001 |
| `CORS_ORIGIN` | Frontend URL | * (all) |
| `CH_API_KEY` | Companies House lookup | (feature disabled without it) |
| `RATE_LIMIT_MAX` | Max requests per minute | 100 |
| `LOG_LEVEL` | Logging verbosity | info |

---

## Part C: Generating SESSION_SECRET (CRITICAL)

### What Is SESSION_SECRET?

A **random string** used to:
- Sign session cookies
- Generate CSRF tokens
- Protect against session hijacking

**Why is it required?**
- Previous version had a default dev secret ('dev-secret-change-in-production')
- **HUGE security risk** if left as default in production
- New version: NO DEFAULT - you MUST generate one

### How To Generate It (3 Methods)

**Pick ONE method:**

---

#### Method 1: Using Node.js (Recommended)

**Step 1:** Open Command Prompt (Windows) or Terminal (Mac/Linux)

**Step 2:** Type this command and press Enter:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Step 3:** You'll see output like this:

```
a3f7b9c2d5e1f8a0b4c7d2e9f3a6b8c1d4e7f0a2b5c8d1e4f7a9b2c5d8e1f4a7
```

**Step 4:** Copy this entire string (it's your SESSION_SECRET)

---

#### Method 2: Using OpenSSL (Mac/Linux/Git Bash)

**Step 1:** Open Terminal or Git Bash

**Step 2:** Type this command:

```bash
openssl rand -hex 32
```

**Step 3:** Copy the output

---

#### Method 3: Using PowerShell (Windows)

**Step 1:** Open PowerShell (search for it in Start menu)

**Step 2:** Type this command:

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Step 3:** Copy the output

---

### IMPORTANT: Keep Your SECRET Safe

✅ **DO:**
- Store it in your .env file
- Keep it secret (don't share with anyone except IT if needed)
- Write it down somewhere secure as backup

❌ **DON'T:**
- Put it in code files
- Share it on Slack/Email
- Commit it to GitHub
- Use a simple password like "password123"

---

## Part D: Creating Your .env File

### Step 1: Find the .env.example File

Navigate to your project folder:

```
C:\Users\YourName\...\Barts_Health_SSF-main\supplier-form-api\
```

You should see a file called `.env.example`

### Step 2: Copy the Example File

**Windows:**
1. Right-click on `.env.example`
2. Click "Copy"
3. Right-click in the same folder
4. Click "Paste"
5. Rename the copy to `.env` (remove ".example")

**Mac/Linux:**
```bash
cp .env.example .env
```

### Step 3: Open .env in a Text Editor

Use Notepad (Windows) or TextEdit (Mac) or VS Code.

### Step 4: Fill In Your Values

Replace `<placeholders>` with real values:

```env
# ===== REQUIRED VARIABLES =====

# Database (from your SQL Server setup)
DB_HOST=your-sql-server.database.windows.net
DB_NAME=NHSSupplierForms
DB_USER=SupplierFormAPI
DB_PASSWORD=YourActualDatabasePassword

# Azure AD (from IT)
AZURE_AD_CLIENT_ID=abc123-def456-ghi789
AZURE_AD_TENANT_ID=xyz789-uvw456-rst123

# SharePoint (from your SharePoint setup)
SP_SITE_URL=https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms
SP_CLIENT_ID=sp-client-id-here
SP_CLIENT_SECRET=sp-client-secret-here
SP_TENANT_ID=same-as-azure-ad-tenant-id

# ⚠️ SESSION_SECRET (GENERATE THIS - see Part C above)
SESSION_SECRET=a3f7b9c2d5e1f8a0b4c7d2e9f3a6b8c1d4e7f0a2b5c8d1e4f7a9b2c5d8e1f4a7

# ===== OPTIONAL VARIABLES =====

# Companies House (optional - for company lookup feature)
CH_API_KEY=your-companies-house-key
CH_API_URL=https://api.company-information.service.gov.uk

# Application
NODE_ENV=production
API_PORT=3001
CORS_ORIGIN=https://weshare.bartshealth.nhs.uk

# Security
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
```

### Step 5: Save the File

**IMPORTANT:** Save as `.env` (with the dot at the start, no file extension)

---

## Part E: Test Your Configuration

### Step 1: Install Dependencies

Open Command Prompt/Terminal in the `supplier-form-api` folder:

```bash
npm install
```

This installs new security packages:
- `express-session`
- `csurf`
- `cookie-parser`

### Step 2: Try Starting the API

```bash
npm run dev
```

### What Should Happen:

**✅ SUCCESS:**
```
Environment validation passed ✓
Passport authentication configured
Server listening on port 3001
Database connected
SharePoint configured
```

**❌ FAILURE:**
```
ERROR: Missing required environment variables: SESSION_SECRET, DB_PASSWORD
Server will not start
```

If you see the ERROR:
1. Check your .env file has all REQUIRED variables
2. Make sure SESSION_SECRET is filled in (not still `<REPLACE_WITH_GENERATED_SECRET>`)
3. Double-check there are no typos

---

## Part F: Environment Variable Checklist

Before proceeding to deployment, verify:

### Required Variables Checklist

- [ ] `DB_HOST` - filled in (from SQL Server setup)
- [ ] `DB_NAME` - set to `NHSSupplierForms`
- [ ] `DB_USER` - filled in (from SQL Server setup)
- [ ] `DB_PASSWORD` - filled in (from SQL Server setup)
- [ ] `AZURE_AD_CLIENT_ID` - filled in (from IT)
- [ ] `AZURE_AD_TENANT_ID` - filled in (from IT)
- [ ] `SP_SITE_URL` - filled in (from SharePoint setup)
- [ ] `SP_CLIENT_ID` - filled in (from IT)
- [ ] `SP_CLIENT_SECRET` - filled in (from IT)
- [ ] `SESSION_SECRET` - **generated and filled in** (NOT a placeholder!)

### File Checklist

- [ ] `.env` file exists in `supplier-form-api/` folder
- [ ] `.env` file has real values (not `<placeholders>`)
- [ ] `.env` file is NOT committed to Git (should be in .gitignore)
- [ ] Backup copy of SESSION_SECRET stored somewhere safe

---

## What You've Accomplished

🎉 **Congratulations!** You have:

1. Understood what environment variables are and why they're needed
2. Generated a secure SESSION_SECRET
3. Created and configured your .env file
4. Installed new security dependencies
5. Verified the API can start with your configuration

---

## Troubleshooting

### "API says missing required environment variables"

**Cause:** .env file doesn't have all required variables

**Fix:**
1. Open your .env file
2. Check each REQUIRED variable from Part B
3. Make sure none have placeholder text like `<your-value-here>`
4. Save and try again

### "I generated SESSION_SECRET but API still says it's missing"

**Cause:** SESSION_SECRET line might be commented out or have a typo

**Fix:**
1. Open .env file
2. Find the SESSION_SECRET line
3. Make sure it doesn't start with `#` (that's a comment)
4. Make sure the format is: `SESSION_SECRET=yourlongstringhere` (no spaces around =)

### "npm install fails"

**Cause:** Network issue or npm not installed

**Fix:**
1. Make sure you're connected to the internet
2. Try: `npm install --verbose` to see detailed errors
3. Make sure Node.js is installed: `node --version` (should show v18 or higher)

### ".env file not found"

**Cause:** File might be in wrong folder or have wrong name

**Fix:**
1. Make sure the file is in `supplier-form-api/.env` (not in the root folder)
2. Make sure the name is exactly `.env` (with the dot, no .txt extension)
3. On Windows: In File Explorer, go to View → Show file extensions

---

## Next Steps

Once this checklist is complete, you're ready to:

1. **Proceed with database setup** (if not done yet) → [02-sql-server.md](02-sql-server.md)
2. **Proceed with SharePoint setup** (if not done yet) → [03-sharepoint.md](03-sharepoint.md)
3. **Deploy to production** → [docs/DEPLOYMENT.md](../DEPLOYMENT.md)

---

*Document Version: 1.0 | Created: February 3, 2026*
*Part of security enhancement updates*
