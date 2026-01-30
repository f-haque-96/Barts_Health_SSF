# Step 1: SQL Server Database Setup

## Beginner's Guide - Read Everything Carefully

**Estimated Time:** 30-45 minutes
**Difficulty:** Medium
**What You'll Create:** The database that stores all supplier form data

---

## Before You Start Checklist

Check these boxes before proceeding:

- [ ] I have a computer with Windows
- [ ] I know if we have SQL Server at Barts Health (ask IT if unsure)
- [ ] I have SQL Server Management Studio (SSMS) installed, OR I will install it

### Don't Have SSMS Installed?

**Download it free from Microsoft:**
1. Open your web browser
2. Go to: https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
3. Click the download link
4. Run the installer and follow the prompts
5. Restart your computer if asked

---

## Part A: Find Out Your SQL Server Details

### You Need to Know:

| Information Needed | Where to Get It | Write It Here |
|-------------------|-----------------|---------------|
| Server Name | Ask IT or DBA | _________________ |
| Your Username | Usually your Windows login | _________________ |
| Your Password | Your Windows password OR ask IT | _________________ |
| Authentication Type | Ask IT: "Windows" or "SQL Server" | _________________ |

### Sample Email to IT (if you don't know):

```
Subject: SQL Server Access Request - Supplier Setup Form Project

Hi,

I'm setting up the database for the new Supplier Setup Form application.

Could you please provide:
1. SQL Server name I should connect to (for a new database)
2. Do I use Windows Authentication or SQL Server Authentication?
3. Do I have permission to create a new database called "NHSSupplierForms"?

If I don't have permission, could you create the database for me and grant me db_owner access?

Thanks,
Fahimul
```

---

## Part B: Open SQL Server Management Studio

### Step-by-Step:

**Step 1:** Click the Windows Start button (bottom left of screen)

**Step 2:** Type: `SQL Server Management Studio`

**Step 3:** Click on the application when it appears

**Step 4:** Wait for it to open (may take 30 seconds)

You should see a "Connect to Server" window pop up.

---

## Part C: Connect to the Server

### What You'll See:

```
┌─────────────────────────────────────────────────────────────┐
│            Connect to Server                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Server type:    [Database Engine          ▼]              │
│                                                             │
│  Server name:    [_________________________▼]              │
│                                                             │
│  Authentication: [Windows Authentication   ▼]              │
│                                                             │
│  User name:      [greyed out if Windows Auth]              │
│                                                             │
│  Password:       [greyed out if Windows Auth]              │
│                                                             │
│              [Connect]        [Cancel]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fill It In:

1. **Server type:** Leave as "Database Engine"

2. **Server name:** Type the server name IT gave you
   - Example: `YOURSERVER\SQLEXPRESS` or `sqlserver.bartshealth.nhs.uk`

3. **Authentication:**
   - If IT said "Windows Authentication" → Select that (easiest)
   - If IT said "SQL Server Authentication" → Select that, then enter username/password

4. **Click the blue "Connect" button**

### If It Fails:

| Error Message | What To Do |
|---------------|------------|
| "Cannot connect to server" | Check server name is correct, ask IT |
| "Login failed" | Check username/password, ask IT for access |
| "Network error" | Make sure you're on the NHS network (VPN if remote) |

---

## Part D: Create the Database

### Step 1: Find the "New Query" Button

Look at the top toolbar. Click the button that says **"New Query"**

A white text area will appear on the right side.

### Step 2: Type This Command

In the white text area, type EXACTLY this:

```sql
CREATE DATABASE NHSSupplierForms;
```

### Step 3: Run the Command

- Press **F5** on your keyboard
- OR click the green **"Execute"** button in the toolbar

### Step 4: Check It Worked

Look at the bottom of the screen. You should see:

```
Commands completed successfully.
```

### Step 5: Refresh to See Your Database

1. On the LEFT side, find "Databases"
2. RIGHT-CLICK on "Databases"
3. Click "Refresh"
4. You should now see "NHSSupplierForms" in the list

**✅ CHECKPOINT: Can you see "NHSSupplierForms" in the database list? If yes, continue. If no, re-read the steps above.**

---

## Part E: Run the Schema Script

This creates all the tables inside your database.

### Step 1: Open the Schema File

1. In SSMS, click **File** menu (top left)
2. Click **Open**
3. Click **File...**
4. Navigate to your project folder:
   ```
   C:\Users\FHaqu\Documents\bh_supplier_setup_form\nhs-supplier-form-react\supplier-form-api\database\
   ```
5. Select the file: `schema.sql`
6. Click **Open**

The file contents will appear in a new tab.

### Step 2: Select Your Database

**IMPORTANT - Don't skip this!**

1. Look at the top toolbar
2. Find the dropdown that shows database names (might say "master")
3. Click it and select **"NHSSupplierForms"**

```
┌─────────────────────────────────────────────────────────────┐
│  [Execute] [Stop]    Database: [NHSSupplierForms    ▼]     │
│                                  ↑                          │
│                         MAKE SURE THIS SAYS                 │
│                         "NHSSupplierForms"                  │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Run the Script

1. Press **F5** on your keyboard
2. OR click the green **"Execute"** button

### Step 4: Wait and Check

The script will take 10-30 seconds to run.

Look at the bottom "Messages" panel. You should see:

```
Commands completed successfully.
```

If you see any red error text, STOP and read the error message.

---

## Part F: Verify Everything Was Created

### Step 1: Expand Your Database

On the LEFT side panel:

1. Click the **+** next to "Databases"
2. Click the **+** next to "NHSSupplierForms"
3. Click the **+** next to "Tables"

### Step 2: Check These Tables Exist

You should see these 5 tables:

- [ ] `dbo.Submissions`
- [ ] `dbo.SubmissionDocuments`
- [ ] `dbo.AuditTrail`
- [ ] `dbo.VendorsReference`
- [ ] `dbo.NotificationQueue`

### Step 3: Quick Test

1. Click **New Query** button
2. Make sure "NHSSupplierForms" is selected in the database dropdown
3. Type this:

```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
```

4. Press **F5**

You should see a list of 5 tables appear in the results.

---

## Part G: Create the API User (Optional - Can Do Later)

If you want to create the user the backend will use:

### Step 1: New Query Window

1. Click **New Query**
2. Make sure "NHSSupplierForms" is selected

### Step 2: Run This Script

**IMPORTANT: Change the password to something secure!**

```sql
-- Create login (server level)
CREATE LOGIN SupplierFormAPI WITH PASSWORD = 'ChangeThis2ASecurePassword!';

-- Create user (database level)
CREATE USER SupplierFormAPI FOR LOGIN SupplierFormAPI;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Submissions TO SupplierFormAPI;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.SubmissionDocuments TO SupplierFormAPI;
GRANT SELECT, INSERT ON dbo.AuditTrail TO SupplierFormAPI;
GRANT SELECT ON dbo.VendorsReference TO SupplierFormAPI;
GRANT SELECT, INSERT, UPDATE ON dbo.NotificationQueue TO SupplierFormAPI;
GRANT EXECUTE ON SCHEMA::dbo TO SupplierFormAPI;

PRINT 'API User created successfully!';
```

3. Press **F5** to run

4. **WRITE DOWN THE PASSWORD** - You'll need it later for the backend configuration

---

## Completion Checklist

Before moving to the next step, verify:

- [ ] SQL Server Management Studio is installed and working
- [ ] I can connect to the SQL Server
- [ ] Database "NHSSupplierForms" exists
- [ ] All 5 tables were created (Submissions, SubmissionDocuments, AuditTrail, VendorsReference, NotificationQueue)
- [ ] (Optional) API user "SupplierFormAPI" was created
- [ ] (Optional) I wrote down the API user password somewhere safe

---

## What You've Accomplished

🎉 **Congratulations!** You have:

1. Created the main database for the Supplier Setup Form
2. Created all the tables to store:
   - Form submissions
   - Uploaded document metadata
   - Audit trail (who did what, when)
   - Existing vendors (for duplicate checking)
   - Notification queue (for email triggers)

---

## Troubleshooting

### "I don't have permission to create a database"

Ask IT to create it for you:
```
"Please create a database called 'NHSSupplierForms' and grant me db_owner access."
```

### "The schema script shows errors"

Common fixes:
1. Make sure you selected the right database (NHSSupplierForms) from the dropdown
2. If it says "already exists", the table was already created - this is OK
3. Copy the exact error message and search Google, or ask for help

### "I can't connect to the server"

1. Make sure you're on the NHS network
2. Double-check the server name with IT
3. Try Windows Authentication first
4. Ask IT to verify your account has SQL Server access

---

## Next Step

Once this checklist is complete, move on to:
**→ 02-SHAREPOINT-LIBRARIES-SETUP.md**

---

*Document Version: 1.0 | Created: January 2026*
