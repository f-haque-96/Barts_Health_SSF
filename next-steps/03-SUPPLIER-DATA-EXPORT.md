# Step 3: Prepare Existing Supplier Data for Import

## Beginner's Guide - Read Everything Carefully

**Estimated Time:** 1-2 hours (depending on data access)
**Difficulty:** Easy-Medium
**What You'll Create:** A clean CSV file of existing suppliers for duplicate detection

---

## ⚠️ Security Update (February 2026)

This data export feeds into the **duplicate vendor detection** feature, which is one of the security enhancements added to prevent:
- Duplicate supplier creation (fraud risk)
- Multiple vendor numbers for the same company (audit issues)
- Payment fraud through fake duplicates

The system now uses **fuzzy matching** and exact matching on CRN/VAT numbers to catch duplicates automatically.

---

## Why Do This?

When a new supplier request comes in, AP Control needs to check:
- "Is this supplier already in our system?"
- "Does this VAT number already belong to another vendor?"

By importing your existing suppliers into the database, the system can **automatically** flag potential duplicates.

**What changed in Feb 2026:** The backend now actually implements the duplicate checking logic (previously it was a TODO). Your export will now be actively used by the system.

---

## Before You Start Checklist

- [ ] I have access to our finance system (Oracle, SAP, or whatever Barts uses)
- [ ] OR I know someone in Finance who can export this data for me
- [ ] I have Microsoft Excel installed
- [ ] I have completed Step 1 (SQL Server Setup)

---

## Part A: Understand What Data You Need

### Required Fields

| Field | Description | Example | Required? |
|-------|-------------|---------|-----------|
| **VendorNumber** | Your internal vendor/supplier ID | V001, SUP12345 | ✅ Yes |
| **CompanyName** | Legal company name | Acme Solutions Ltd | ✅ Yes |
| **VATNumber** | UK VAT registration number | GB123456789 | If available |
| **CRN** | Companies House registration | 12345678 | If available |

### Optional Fields (Nice to Have)

| Field | Description | Example |
|-------|-------------|---------|
| TradingName | "Doing business as" name | Acme |
| IsActive | Is this vendor still used? | TRUE/FALSE |

---

## Part B: Export Data from Your Finance System

### Option 1: If You Have Direct Access

**For Oracle:**
1. Log into Oracle
2. Navigate to: Suppliers/Vendors list
3. Look for "Export" or "Download" option
4. Export as CSV or Excel

**For SAP:**
1. Log into SAP
2. Transaction code: XK03 or similar vendor report
3. Export to spreadsheet

**For Other Systems:**
1. Find the Vendors/Suppliers module
2. Look for a report or export function
3. Export all active suppliers

### Option 2: If You Need Help from Finance Team

Send this email:

```
Subject: Supplier Data Export Request - Urgent Project

Hi,

I'm working on the new Supplier Setup Form project and need to export our existing
supplier/vendor data for duplicate checking purposes.

Could you please provide a spreadsheet export with the following fields for ALL suppliers:

1. Vendor Number (your internal ID)
2. Company Name (legal name)
3. VAT Number (if we have it)
4. Company Registration Number (if we have it)
5. Trading Name (if different from legal name)
6. Active Status (active/inactive)

Format: Excel or CSV
Scope: All suppliers (active and inactive)

This is for a project to prevent duplicate supplier creation and reduce fraud risk.

Thanks,
Fahimul
```

---

## Part C: Clean Up the Data in Excel

Once you have the export, open it in Excel and follow these steps.

### Step 1: Open the File

1. Open Microsoft Excel
2. Open your exported file (File → Open)

### Step 2: Check Column Headers

Your first row should have headers. Rename them to match EXACTLY:

| Your Header | Rename To |
|-------------|-----------|
| Vendor ID, Supplier ID, Vendor No. | `VendorNumber` |
| Company Name, Supplier Name, Name | `CompanyName` |
| VAT, VAT Number, VAT Reg | `VATNumber` |
| CRN, Company Reg, Registration No. | `CRN` |
| Trading As, Trading Name, DBA | `TradingName` |
| Status, Active | `IsActive` |

### Step 3: Format VAT Numbers

VAT numbers should be in format: **GB123456789** (GB + 9 digits)

**Quick Fix in Excel:**

If your VAT numbers are just numbers (e.g., 123456789):
1. Click on the VAT column header to select the whole column
2. Press **Ctrl+H** (Find & Replace)
3. Find: `^` (start of cell)
4. Replace: `GB`
5. Click "Replace All"

If VAT numbers have spaces or dashes:
1. Select the VAT column
2. Press **Ctrl+H**
3. Find: ` ` (space)
4. Replace: (leave empty)
5. Click "Replace All"

### Step 4: Format CRN Numbers

CRN should be 8 digits. If shorter, add leading zeros.

**Quick Fix:**
1. Click the CRN column header
2. Right-click → Format Cells
3. Choose "Text" (not Number)
4. This preserves leading zeros

### Step 5: Clean Company Names

Remove any weird characters:
1. Select the CompanyName column
2. Press **Ctrl+H**
3. Find and replace these one at a time:
   - `"` → (empty)
   - `'` → (empty)
   - Extra spaces: `  ` (two spaces) → ` ` (one space)

### Step 6: Set IsActive Values

If you have an Active/Status column, convert to simple values:
- Active, Yes, Y, TRUE, 1 → `1`
- Inactive, No, N, FALSE, 0 → `0`

### Step 7: Delete Unnecessary Columns

Keep ONLY these columns (delete everything else):
1. VendorNumber
2. CompanyName
3. TradingName (if you have it)
4. VATNumber
5. CRN
6. IsActive

### Step 8: Arrange Columns in Order

Drag columns so they're in this order (left to right):

```
A: VendorNumber
B: CompanyName
C: TradingName
D: VATNumber
E: CRN
F: IsActive
```

---

## Part D: Verify Your Data

### Check 1: No Blank Vendor Numbers

1. Click on cell A1
2. Press **Ctrl+End** to go to the last row
3. Check that every row has a VendorNumber

### Check 2: No Blank Company Names

1. Click on cell B1
2. Press **Ctrl+Down** repeatedly
3. If it jumps past rows, those rows have blanks - fix them

### Check 3: VAT Numbers Look Right

Scan through the VAT column. They should all:
- Start with "GB"
- Have 9 digits after GB
- Example: GB123456789

### Check 4: Count Your Rows

1. Press **Ctrl+End**
2. Note the row number (e.g., Row 5,001 means 5,000 suppliers)
3. Is this approximately how many suppliers you expected?

---

## Part E: Save as CSV

### Step 1: Save a Backup First

1. Press **Ctrl+S**
2. Save as Excel format (.xlsx) first as a backup

### Step 2: Save as CSV

1. Click **File** → **Save As**
2. Choose location: `C:\Users\FHaqu\Documents\bh_supplier_setup_form\`
3. Filename: `existing_suppliers.csv`
4. **Save as type:** Select **"CSV (Comma delimited) (*.csv)"**
5. Click **Save**
6. Click "Yes" if it warns about features not compatible with CSV

### Step 3: Verify the CSV

1. Open Notepad
2. Drag and drop the CSV file onto Notepad
3. Check it looks like this:

```csv
VendorNumber,CompanyName,TradingName,VATNumber,CRN,IsActive
V001,Acme Solutions Ltd,,GB123456789,12345678,1
V002,Smith Consulting Limited,Smith & Co,GB987654321,87654321,1
V003,NHS Supply Chain,,,00012345,1
```

---

## Part F: Store the File Safely

### Save Location

Move/copy your CSV file to the project folder:

```
C:\Users\FHaqu\Documents\bh_supplier_setup_form\nhs-supplier-form-react\supplier-form-api\data\
```

You may need to create the `data` folder:
1. Open File Explorer
2. Navigate to: `C:\Users\FHaqu\Documents\bh_supplier_setup_form\nhs-supplier-form-react\supplier-form-api\`
3. Right-click → New → Folder
4. Name it: `data`
5. Move your `existing_suppliers.csv` into this folder

---

## Part G: Sample Data Template

If you're having trouble getting real data, here's a template to understand the format:

```csv
VendorNumber,CompanyName,TradingName,VATNumber,CRN,IsActive
V001,Acme Solutions Limited,,GB123456789,12345678,1
V002,Smith Healthcare Ltd,Smith Medical,GB234567890,23456789,1
V003,Johnson & Partners LLP,,GB345678901,34567890,1
V004,NHS Property Services,,,,1
V005,Totally Local Company Ltd,TLC Services,GB456789012,45678901,1
V006,Old Supplier Ltd,,,56789012,0
V007,International Pharma UK,IP Healthcare,GB567890123,67890123,1
V008,Royal Mail Group Ltd,,GB243278054,02579490,1
V009,BT PLC,,GB245107014,04190816,1
V010,Vodafone Limited,,GB569953277,01833679,1
```

---

## Completion Checklist

Before finishing, verify:

- [ ] I have exported supplier data from our finance system
- [ ] The data has been cleaned up in Excel
- [ ] Column headers are exactly: VendorNumber, CompanyName, TradingName, VATNumber, CRN, IsActive
- [ ] VAT numbers start with GB (if present)
- [ ] File is saved as CSV format
- [ ] CSV file is stored in: `supplier-form-api/data/existing_suppliers.csv`
- [ ] I know approximately how many suppliers are in the file

---

## What You've Accomplished

🎉 **Congratulations!** You have:

1. Exported your organization's existing supplier data
2. Cleaned and formatted it for database import
3. Prepared it for duplicate detection feature

**This data will be used to:**
- Automatically check if a new supplier already exists
- Flag potential duplicates by VAT number or company name
- Save AP Control time on manual checks

---

## What Happens Next (For Later)

When the backend is fully set up, this data will be imported into the `VendorsReference` table using a command like:

```sql
BULK INSERT VendorsReference
FROM 'C:\path\to\existing_suppliers.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    FIRSTROW = 2
);
```

**You don't need to do this now** - it will be done when the full system is deployed.

### How Duplicate Detection Works (Feb 2026 Update)

Once imported, the backend API will:
1. **Exact Match on CRN:** If Companies House number matches exactly → flag as duplicate
2. **Exact Match on VAT:** If VAT number matches exactly → flag as duplicate
3. **Fuzzy Match on Name:** If company name is very similar → flag as potential duplicate
4. **Manual Review:** AP Control sees flagged duplicates and decides whether to proceed

This prevents creating multiple vendor records for the same supplier (fraud prevention).

---

## Troubleshooting

### "I can't access the finance system"

Ask your Finance team or Finance Systems Administrator for help with the export. Use the email template in Part B.

### "The export has thousands of columns"

You only need 6 columns. Delete all the others in Excel before saving as CSV.

### "VAT numbers have different formats"

Standardize them all to GB + 9 digits:
- `GB 123 456 789` → `GB123456789`
- `123456789` → `GB123456789`
- `UK123456789` → `GB123456789`

### "Some suppliers don't have VAT or CRN"

That's OK! Leave those cells empty. The system will still check by company name.

### "The file is huge (50MB+)"

This is fine. SQL Server can handle large imports. If Excel struggles:
1. Save and close Excel frequently
2. Consider splitting into multiple smaller files

---

## Data Privacy Reminder

⚠️ **IMPORTANT:** This supplier data is business information. Handle it appropriately:

- Don't email the CSV file externally
- Store it only on NHS computers/network drives
- Delete temporary copies when done
- This is supplier business data, not personal data, so GDPR concerns are lower

---

## Summary: Files You Should Now Have

```
supplier-form-api/
├── data/
│   └── existing_suppliers.csv    ← YOUR SUPPLIER DATA
├── database/
│   └── schema.sql                ← Already exists
└── ...
```

---

## All Steps Complete!

If you've completed all three guides:

1. ✅ SQL Server database created and tables set up
2. ✅ SharePoint document libraries created
3. ✅ Existing supplier data prepared for import

**While waiting for IT to set up Azure AD, you can:**
- Review the data you've exported
- Double-check your SQL tables exist
- Familiarize yourself with the SharePoint site

**Next dependency:** Azure AD setup from IT
- Once IT provides the App Registration details, you can proceed with backend and frontend deployment

---

*Document Version: 1.0 | Created: January 2026*
