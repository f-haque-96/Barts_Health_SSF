# Debugging File Upload Validation Issue

## Current Status

You're seeing "Missing Required Uploads" warnings even after uploading files. I've added debug logging to help us understand what's happening.

---

## Step 1: Check Console Logs

1. **Open Browser DevTools**
   - Press `F12` or right-click → Inspect
   - Click on the **Console** tab

2. **Upload Files Again**
   - Go to Section 2
   - Upload letterhead and procurement approval documents
   - Watch the console for these messages:
     ```
     [DEBUG] Section 2 Validation - uploadedFiles: {letterhead: {...}, procurementApproval: {...}}
     [DEBUG] procurementApproval: {name: "...", size: ..., type: "...", file: File}
     [DEBUG] letterhead: {name: "...", size: ..., type: "...", file: File}
     ```

3. **Navigate to Section 7**
   - Watch for the same debug messages
   - **Take a screenshot of the console output** and send it to me

---

## Step 2: Check Uploaded Files in Store

While on Section 7, open the Console and run this command:

```javascript
// Check what files are in the store
useFormStore.getState().uploadedFiles
```

This will show you exactly what's in the uploadedFiles state. **Send me the output.**

Expected output if files are uploaded correctly:
```javascript
{
  letterhead: {
    name: "Bank Details - Evans Pharmacy.pdf",
    size: 123456,
    type: "application/pdf",
    file: File {...},
    uploadDate: "2026-02-06T..."
  },
  procurementApproval: {
    name: "pinnacle confirmation (1).pdf",
    size: 78910,
    type: "application/pdf",
    file: File {...},
    uploadDate: "2026-02-06T..."
  }
}
```

---

## Step 3: Check Form Data

Also run this in the console:

```javascript
// Check form data
const formData = useFormStore.getState().formData;
console.log('procurementEngaged:', formData.procurementEngaged);
console.log('letterheadAvailable:', formData.letterheadAvailable);
```

This will show if the form fields that trigger the upload requirements are set correctly.

---

## Step 4: Scroll Up on Section 7

On Section 7, **scroll to the very top** of the page and look for the "Required Documents" section.

**Does it show:**
- ✅ Green background with "Uploaded" badges?
- ❌ Red background with "Required" badges?

**Send me a screenshot of that section too.**

---

## Common Issues

### Issue 1: Files Cleared by Refresh
If you refreshed the page after uploading, files are intentionally cleared for security (SEC-03 fix).

**Solution:** Complete the form in ONE session without refreshing.

### Issue 2: Store Not Updating
If files show in console but validation still fails, there might be a React state update issue.

**Solution:** Try clicking "Previous" then "Next" again to force a re-render.

### Issue 3: Different File Keys
If the console shows files under different keys (e.g., `procurementApprovalDoc` instead of `procurementApproval`), the keys don't match.

**Solution:** Check what keys the FileUpload component is using when calling `setUploadedFile()`.

---

## Bank Details Issue on AP Control Review Page

You mentioned bank details are missing on the AP Control review page for CoP (Confirmation of Payee) verification.

### Why Bank Details Might Be Missing

The SEC-03 security fix excludes bank details from localStorage:
```javascript
// These are NOT persisted to localStorage:
- sortCode
- accountNumber
- iban
- swiftCode
```

### Where AP Control Page Gets Data

**Question:** Is the AP Control review page loading data from:
1. **Local formStore** (from localStorage) - Bank details won't be there
2. **Backend API** (from database/submission) - Bank details should be there

### Check This

On the AP Control review page, open Console and run:
```javascript
// Check where submission data comes from
const page = document.querySelector('[data-component="APControlReviewPage"]');
console.log('Submission source:', page?.dataset?.source);

// Check if bank details are in the submission object
const submission = /* however the page stores it */;
console.log('Bank details:', {
  sortCode: submission?.formData?.sortCode,
  accountNumber: submission?.formData?.accountNumber,
  iban: submission?.formData?.iban
});
```

---

## Next Steps

1. **Send me the console outputs** from Steps 1-3
2. **Send screenshot** of the "Required Documents" section at the top of Section 7
3. **Clarify** about the AP Control page:
   - Are you testing the AP Control review workflow in dev mode?
   - Is the submission loaded from the backend API or local storage?
   - Does the bank details section show empty fields or is it completely missing?

Once I see the debug outputs, I can identify exactly what's wrong and fix it.

---

## If You Want to Test Right Now

1. **Clear everything** - Reset form completely
2. **Start fresh** - Go to Section 1
3. **Don't refresh** - Complete Sections 1-2 in one session
4. **Upload files** - Upload letterhead and procurement approval in Section 2
5. **Navigate to Section 7** - Check if warnings appear
6. **Send me console logs** - Copy all [DEBUG] messages from console

This will give me the cleanest test data to work with.
