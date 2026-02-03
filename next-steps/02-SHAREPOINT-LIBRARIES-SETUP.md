# Step 2: SharePoint Document Libraries Setup

## Beginner's Guide - Read Everything Carefully

**Estimated Time:** 20-30 minutes
**Difficulty:** Easy
**What You'll Create:** Two document libraries to store uploaded files securely

---

## Why Two Libraries?

| Library | What Goes Here | Who Can See |
|---------|----------------|-------------|
| **SupplierDocuments** | Contracts, letterheads, PBP certificates | All reviewers |
| **SensitiveDocuments** | Passports, driving licences, ID docs | AP Control + Admin ONLY |

**IMPORTANT:** Keeping sensitive documents separate protects personal data and ensures passports/IDs are never accidentally shared or synced to Alemba.

---

## Before You Start Checklist

- [ ] I have a web browser (Chrome, Edge, or Firefox)
- [ ] I can access SharePoint (https://bartshealth.sharepoint.com)
- [ ] I have permission to create sites/libraries (if not, I'll request access)

---

## Part A: Access SharePoint

### Step 1: Open SharePoint

1. Open your web browser (Chrome or Edge recommended)
2. Go to: **https://bartshealth.sharepoint.com**
3. Log in with your NHS email and password if prompted

### Step 2: Check You're Logged In

Look at the top right corner. You should see your name or initials.

If you see "Sign in", click it and enter your NHS credentials.

---

## Part B: Create a New SharePoint Site

### Step 1: Go to SharePoint Start Page

1. Click on the **SharePoint** logo (top left) to go to the home page
2. OR go to: https://bartshealth.sharepoint.com/_layouts/15/sharepoint.aspx

### Step 2: Create New Site

1. Look for **"+ Create site"** button (usually top left area)
2. Click it

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   + Create site                                             │
│                                                             │
│   ┌───────────────┐    ┌───────────────┐                   │
│   │               │    │               │                   │
│   │  Team site    │    │ Communication │                   │
│   │               │    │     site      │                   │
│   │    ← PICK     │    │               │                   │
│   │      THIS     │    │               │                   │
│   └───────────────┘    └───────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

3. Click **"Team site"**

### Step 3: Fill In Site Details

You'll see a form. Fill it in EXACTLY like this:

| Field | What to Enter |
|-------|---------------|
| **Site name** | `NHS-Supplier-Forms` |
| **Site description** | `Document storage for Supplier Setup Form application` |
| **Privacy settings** | Select **Private** (only members can access) |
| **Language** | English |

### Step 4: Click "Next"

### Step 5: Add Owners (Optional for now)

You can add other people as owners later. For now:

1. Your name should already be there as an owner
2. Click **"Finish"**

### Step 6: Wait for Site Creation

SharePoint will create your site. This takes 30-60 seconds.

You'll be automatically taken to your new site when it's ready.

**✅ CHECKPOINT: Are you now on a page that says "NHS-Supplier-Forms" at the top? If yes, continue.**

---

## Part C: Create the First Document Library (SupplierDocuments)

### Step 1: Find the "New" Button

Look at the top of the page. Find the **"+ New"** button.

### Step 2: Click "New" → "Document library"

```
┌─────────────────────────────────────┐
│  + New  ▼                          │
├─────────────────────────────────────┤
│  📄 Document library    ← CLICK    │
│  📋 List                           │
│  📁 Folder                         │
│  📝 Page                           │
│  ...                               │
└─────────────────────────────────────┘
```

### Step 3: Name the Library

A panel will appear on the right side.

| Field | What to Enter |
|-------|---------------|
| **Name** | `SupplierDocuments` |
| **Description** | `Business documents - contracts, letterheads, PBP certificates. Can sync to Alemba.` |

### Step 4: Click "Create"

Wait a few seconds. The library will be created.

**✅ CHECKPOINT: Can you see "SupplierDocuments" in your site? If yes, continue.**

---

## Part D: Create Folders in SupplierDocuments

### Step 1: Open the SupplierDocuments Library

Click on **"SupplierDocuments"** in the left navigation (or from the site home page).

### Step 2: Create First Folder

1. Click **"+ New"** button
2. Click **"Folder"**
3. Name it: `Letterheads`
4. Click **"Create"**

### Step 3: Create More Folders

Repeat Step 2 for each of these folders:

- [ ] `Letterheads` (done above)
- [ ] `Contracts`
- [ ] `PBP_Certificates`
- [ ] `Insurance_Documents`
- [ ] `Other`

### Step 4: Verify Folders

You should now see 5 folders in your SupplierDocuments library:

```
SupplierDocuments/
├── Letterheads/
├── Contracts/
├── PBP_Certificates/
├── Insurance_Documents/
└── Other/
```

**✅ CHECKPOINT: Can you see all 5 folders? If yes, continue.**

---

## Part E: Create the Second Document Library (SensitiveDocuments)

### Step 1: Go Back to Site Home

Click on **"NHS-Supplier-Forms"** in the top left OR left navigation to go back to the site home page.

### Step 2: Create New Library

1. Click **"+ New"**
2. Click **"Document library"**

### Step 3: Name the Library

| Field | What to Enter |
|-------|---------------|
| **Name** | `SensitiveDocuments` |
| **Description** | `⚠️ SENSITIVE - Passports, driving licences, ID documents. RESTRICTED ACCESS. Never sync to Alemba.` |

### Step 4: Click "Create"

**✅ CHECKPOINT: Can you now see both "SupplierDocuments" AND "SensitiveDocuments" in your site?**

---

## Part F: Create Folders in SensitiveDocuments

### Step 1: Open SensitiveDocuments Library

Click on **"SensitiveDocuments"** in the left navigation.

### Step 2: Create Folders

Create these folders (same process as before):

- [ ] `Passports`
- [ ] `DrivingLicences`
- [ ] `IDDocuments`
- [ ] `ProofOfAddress`

### Step 3: Verify

You should see:

```
SensitiveDocuments/
├── Passports/
├── DrivingLicences/
├── IDDocuments/
└── ProofOfAddress/
```

---

## Part G: Set Permissions on SensitiveDocuments (IMPORTANT)

The SensitiveDocuments library should have restricted access.

### Step 1: Open Library Settings

1. Make sure you're in the **SensitiveDocuments** library
2. Click the **⚙️ gear icon** (top right)
3. Click **"Library settings"**

### Step 2: Find Permissions

1. Look for **"Permissions for this document library"**
   - OR go to **"More library settings"** → **"Permissions for this document library"**

### Step 3: Stop Inheriting Permissions

1. Click **"Stop Inheriting Permissions"**
2. Click **"OK"** on the warning popup

### Step 4: Remove Unnecessary Groups

1. You'll see a list of groups/people with access
2. Select (tick) the groups that should NOT have access
3. Click **"Remove User Permissions"**

**KEEP these groups:**
- Site Owners (admins)
- NHS-SupplierForm-APControl (AP team)
- NHS-SupplierForm-Admin (system admins)

**REMOVE access for:**
- Site Members (general members)
- Site Visitors
- NHS-SupplierForm-PBP
- NHS-SupplierForm-Procurement
- NHS-SupplierForm-OPW
- NHS-SupplierForm-Contract

### If You Can't Find the AD Groups Yet

Don't worry - IT hasn't created them yet. For now:
1. Just remove "Site Members" and "Site Visitors"
2. You can add the specific groups later when IT creates them

---

## Part H: Write Down Important Information

Fill in this information - you'll need it for the backend configuration:

```
SHAREPOINT INFORMATION
======================

Site URL:
https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms

SupplierDocuments Library URL:
https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms/SupplierDocuments

SensitiveDocuments Library URL:
https://bartshealth.sharepoint.com/sites/NHS-Supplier-Forms/SensitiveDocuments

Site Created By: ___________________

Date Created: ___________________
```

---

## Completion Checklist

Before moving to the next step, verify:

- [ ] SharePoint site "NHS-Supplier-Forms" exists
- [ ] SupplierDocuments library exists with 6 folders
- [ ] SensitiveDocuments library exists with 4 folders
- [ ] SensitiveDocuments has restricted permissions (only AP Control + Admin)
- [ ] I wrote down the URLs above

---

## What You've Accomplished

🎉 **Congratulations!** You have:

1. Created a secure SharePoint site for the application
2. Set up two document libraries:
   - **SupplierDocuments** - For business documents (can be shared with Alemba)
   - **SensitiveDocuments** - For ID documents (restricted, never shared)
3. Organized folders for different document types
4. Protected sensitive documents with restricted permissions

---

## Troubleshooting

### "I don't have permission to create a site"

Email your SharePoint admin:
```
Subject: SharePoint Site Creation Request - Supplier Setup Form

Hi,

I need a new SharePoint Team Site created for the Supplier Setup Form project.

Site name: NHS-Supplier-Forms
Privacy: Private
Purpose: Document storage for the new Supplier Setup Form application

Please add me as a Site Owner.

Thanks,
Fahimul
```

### "I can't find the 'New' button"

- Make sure you're on your site's home page
- Try refreshing the page (F5)
- You might not have permission to create libraries - contact your SharePoint admin

### "The permissions section looks different"

SharePoint versions vary slightly. Look for:
- "Library Settings" or "Settings"
- "Permissions" or "Share"
- "Advanced permissions"

If stuck, search Google for "SharePoint Online break permission inheritance [your issue]"

---

## Next Step

Once this checklist is complete, move on to:
**→ 03-SUPPLIER-DATA-EXPORT.md**

---

*Document Version: 1.0 | Created: January 2026*
