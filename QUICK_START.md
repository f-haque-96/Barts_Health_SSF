# QUICK START - Get Backend Running in 2 Hours

## EMERGENCY DEPLOYMENT CHECKLIST

This is the fastest path to getting the backend running. Follow these steps in order.

---

## HOUR 1: SharePoint Setup (30 mins)

### Step 1: Create SharePoint Site (5 mins)

1. Go to: https://bartshealth.sharepoint.com
2. Click **+ Create site** → **Team site**
3. Name: `NHS-Supplier-Forms`
4. Privacy: **Private**
5. Click **Finish**

### Step 2: Create Main List - SupplierSubmissions (15 mins)

1. In your new site, click **+ New** → **List** → **Blank list**
2. Name: `SupplierSubmissions`
3. Add these columns (click **+ Add column** for each):

| Column Name | Type | Required |
|-------------|------|----------|
| Status | Choice | Yes |
| RequesterName | Single line of text | Yes |
| RequesterEmail | Single line of text | Yes |
| RequesterDepartment | Single line of text | Yes |
| CompanyName | Single line of text | Yes |
| SupplierType | Choice | Yes |
| FormDataJSON | Multiple lines of text | Yes |
| SubmittedDate | Date and time | Yes |
| CurrentStage | Choice | Yes |
| PBPApprovedBy | Single line of text | No |
| PBPApprovalDate | Date and time | No |
| ProcurementDecision | Choice | No |
| AlembaTicketID | Single line of text | No |

**Status choices:** `PBP_Pending, PBP_Approved, PBP_Rejected, Submitted, Procurement_Review, OPW_Review, AP_Review, Completed, Rejected`

**CurrentStage choices:** `PBP, Procurement, OPW, ContractDraft, AP, Complete`

**SupplierType choices:** `LIMITED_COMPANY, CHARITY, SOLE_TRADER, PUBLIC_SECTOR`

**ProcurementDecision choices:** `Standard, OPW, Rejected`

### Step 3: Create Document Library (5 mins)

1. Click **+ New** → **Document library**
2. Name: `SupplierDocuments`
3. Create folders: `PBP_Certificates`, `Letterheads`, `Contracts`

---

## HOUR 1: Power Automate Flows (30 mins)

### Step 4: Create First Flow - Submit PBP Questionnaire (15 mins)

1. Go to: https://make.powerautomate.com
2. Click **+ Create** → **Instant cloud flow**
3. Name: `NHS-Supplier-Submit-PBP`
4. Select trigger: **When a HTTP request is received**
5. Click **Create**

**Add these steps:**

**Step 5a:** Click the trigger, paste this JSON Schema:
```json
{
  "type": "object",
  "properties": {
    "requesterName": {"type": "string"},
    "requesterEmail": {"type": "string"},
    "requesterDepartment": {"type": "string"},
    "questionnaireData": {"type": "object"}
  }
}
```

**Step 5b:** Click **+ New step** → Search "Initialize variable"
- Name: `SubmissionID`
- Type: String
- Value: `SUP-@{formatDateTime(utcNow(), 'yyyy')}-@{rand(10000,99999)}`

**Step 5c:** Click **+ New step** → Search "SharePoint" → **Create item**
- Site Address: (select your NHS-Supplier-Forms site)
- List Name: SupplierSubmissions
- Title: `@{variables('SubmissionID')}`
- Status: `PBP_Pending`
- CurrentStage: `PBP`
- RequesterName: `@{triggerBody()?['requesterName']}`
- RequesterEmail: `@{triggerBody()?['requesterEmail']}`
- RequesterDepartment: `@{triggerBody()?['requesterDepartment']}`
- FormDataJSON: `@{string(triggerBody()?['questionnaireData'])}`
- SubmittedDate: `@{utcNow()}`

**Step 5d:** Click **+ New step** → Search "Send email" → **Send an email (V2)**
- To: `pbp-panel@bartshealth.nhs.uk` (your PBP team email)
- Subject: `[ACTION REQUIRED] New Supplier Pre-Screening: @{variables('SubmissionID')}`
- Body:
```
New supplier pre-screening request requires your review.

Submission ID: @{variables('SubmissionID')}
Requester: @{triggerBody()?['requesterName']}
Department: @{triggerBody()?['requesterDepartment']}

Click here to review: https://your-verseone-url/supplier-form/pbp/@{variables('SubmissionID')}
```

**Step 5e:** Click **+ New step** → Search "Response" → **Response**
- Status Code: 200
- Body:
```json
{
  "success": true,
  "submissionId": "@{variables('SubmissionID')}",
  "message": "Submitted for PBP review"
}
```

**Step 5f:** Click **Save**

**Step 5g:** Copy the HTTP POST URL shown in the trigger (you'll need this!)

### Step 5: Create Second Flow - Submit Full Form (15 mins)

Repeat similar process for full form submission:

1. **+ Create** → **Instant cloud flow**
2. Name: `NHS-Supplier-Submit-Form`
3. Trigger: **When a HTTP request is received**

**Steps:**
1. Parse JSON (to extract formData)
2. Update item in SharePoint (Status = `Submitted`, CurrentStage = `Procurement`)
3. Send email to Procurement team
4. Response with success

---

## HOUR 2: Connect Frontend (15 mins)

### Step 6: Update Environment Variables

Edit `.env.production`:

```env
# Paste your Power Automate URLs here
VITE_API_SUBMIT_PBP=https://prod-XX.westeurope.logic.azure.com/workflows/XXX/triggers/manual/paths/invoke?api-version=...
VITE_API_SUBMIT_FORM=https://prod-XX.westeurope.logic.azure.com/workflows/XXX/triggers/manual/paths/invoke?api-version=...

# Disable test buttons
VITE_ENABLE_TEST_BUTTONS=false

# Your VerseOne URL
VITE_APP_BASE_URL=https://your-verseone-intranet.nhs.uk/supplier-form
```

### Step 7: Build and Deploy

```bash
npm run build
```

Upload the `dist` folder contents to VerseOne.

---

## HOUR 2: Testing (15 mins)

### Step 8: Test the Flow

1. Open the form in browser
2. Fill out Section 1 and Section 2
3. Submit the questionnaire
4. Check:
   - [ ] SharePoint list has new item
   - [ ] Email was sent to PBP team
   - [ ] Form shows success message

---

## Alemba Integration (Later - Optional for MVP)

For MVP launch, you can skip Alemba initially. Use email notifications instead.

Add Alemba later by inserting an HTTP action in your Power Automate flows.

---

## TROUBLESHOOTING

### "CORS Error" in browser console
- Power Automate HTTP triggers allow all origins by default
- If still failing, check the URL is correct

### "Unauthorized" error
- Power Automate URLs include authentication in the URL itself
- Make sure you copied the FULL URL including `sig=` parameter

### SharePoint "Access Denied"
- The Power Automate flow runs as YOU
- Make sure you have permission to the SharePoint site

### Email not sending
- Check the "To" address is valid
- Check your O365 sending limits

---

## MINIMUM VIABLE PRODUCT (MVP)

For fastest deployment, you only need:

1. ✅ SharePoint list (SupplierSubmissions)
2. ✅ One Power Automate flow (Submit PBP)
3. ✅ Email notifications (built into flow)
4. ⏳ Alemba (can add later)
5. ⏳ PDF generation (already works client-side)

This gets you:
- Form submissions saved to SharePoint
- Email notifications to reviewers
- Ability to track submissions

---

## CONTACTS TO REACH OUT TO

| Role | Why You Need Them |
|------|-------------------|
| SharePoint Admin | Create site, set permissions |
| Power Automate Admin | Approve premium connectors if needed |
| Alemba Admin | Get API credentials (later) |
| VerseOne Admin | Deploy frontend |

---

## NEXT STEPS AFTER MVP

1. Add remaining Power Automate flows (PBP Decision, Procurement Decision, etc.)
2. Integrate Alemba for ticket routing
3. Add PDF generation in Power Automate
4. Set up role-based access in VerseOne

---

**You can do this! Start with SharePoint and one flow. Get that working, then expand.**
