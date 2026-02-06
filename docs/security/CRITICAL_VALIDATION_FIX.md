# 🔴 CRITICAL Validation Fix - Comprehensive Format Validation

## Critical Bug Fixed

**Issue:** Form validation only checked if fields *existed*, not if they were *valid*. Users could enter invalid data (e.g., 2-digit UTR instead of 10 digits) and still submit the form.

**Impact:** HIGH RISK - Invalid data could be submitted to the system, causing:
- Failed payment processing (invalid sort codes, account numbers)
- Compliance violations (invalid VAT numbers, UTR numbers)
- Integration failures (malformed IBAN, SWIFT codes)
- Data quality issues throughout the system

**Fix:** Implemented comprehensive format and length validation for ALL form fields across ALL sections.

---

## What Was Fixed

### Before (DANGEROUS ❌)
```javascript
// Only checked if field exists, not if it's valid
if (formData.cisRegistered === 'yes' && !formData.utrNumber?.trim()) {
  missing.push('UTR Number');
}
// User could enter "12" and form would accept it!
```

### After (SECURE ✅)
```javascript
// Checks BOTH existence AND format
if (formData.cisRegistered === 'yes') {
  if (!formData.utrNumber?.trim()) {
    missing.push('UTR Number');
  } else {
    const utrClean = formData.utrNumber.replace(/\s/g, '');
    if (!/^[0-9]{10}$/.test(utrClean)) {
      missing.push('UTR Number (must be exactly 10 digits)');
    }
  }
}
// Now "12" will be rejected with clear error message
```

---

## Comprehensive Validation Added

### Section 1: Requester Information

**Format Validation:**
- ✅ First Name: Max 50 characters
- ✅ Last Name: Max 50 characters
- ✅ Job Title: Max 100 characters
- ✅ Department: Max 100 characters
- ✅ NHS Email: Must be valid NHS domain (@nhs.net, @bartshealth.nhs.uk, etc.)
- ✅ Phone Number: UK phone format (7-15 characters, allows +, spaces, hyphens, parentheses)

### Section 2: Pre-screening

**Format Validation:**
- ✅ Justification: Min 10 characters, max 350 characters

### Section 3: Supplier Classification

**Format Validation:**
- ✅ CRN (Limited Company): Must be 7 or 8 digits
- ✅ CRN (Charity): Must be 7 or 8 digits
- ✅ Charity Number: Max 8 digits
- ✅ Annual Value: Must be greater than 0

### Section 4: Supplier Details

**Format Validation:**
- ✅ Company Name: Max 100 characters
- ✅ Registered Address: Max 300 characters
- ✅ City: Max 50 characters, only letters/spaces/hyphens
- ✅ Postcode: Valid UK postcode format (e.g., EC1A 1BB)
- ✅ Contact Name: Max 100 characters
- ✅ Contact Email: Valid email format
- ✅ Contact Phone: UK phone format
- ✅ Website: Must start with https:// (if provided)

### Section 5: Service Description

**Format Validation:**
- ✅ Service Type: Max 7 types
- ✅ Service Description: Min 10 characters, max 350 characters

### Section 6: Financial & Accounts (MOST CRITICAL)

**UK Supplier Banking:**
- ✅ Name on Account: Min 2 characters
- ✅ Sort Code: Exactly 6 digits (removes spaces/hyphens)
- ✅ Account Number: Exactly 8 digits

**Overseas Supplier Banking:**
- ✅ IBAN: 15-34 characters, must start with 2-letter country code
- ✅ SWIFT Code: 8 or 11 characters, valid SWIFT format (AAAABBCCXXX)
- ✅ Bank Routing: Exactly 9 digits

**Financial Information:**
- ✅ GHX/DUNS Number: Exactly 9 digits (removes spaces/hyphens)
- ✅ UTR Number: Exactly 10 digits (removes spaces)
- ✅ VAT Number: 9 or 12 digits after optional GB prefix
- ✅ Public Liability Coverage: Must be greater than 0
- ✅ Public Liability Expiry: Must be today or in the future

**Accounts Address (if different):**
- ✅ Accounts Postcode: Valid UK postcode
- ✅ Accounts Email: Valid email format
- ✅ Accounts Phone: UK phone format

---

## Technical Implementation

### File Modified
- **src/stores/formStore.js** - `getMissingFields` function (lines 534-780 approximately)

### Validation Strategy

1. **Two-Stage Validation:**
   - Stage 1: Check if field exists (required field check)
   - Stage 2: Check if field is valid (format/length check)

2. **Clear Error Messages:**
   - Generic: "UTR Number" (field missing)
   - Specific: "UTR Number (must be exactly 10 digits)" (format error)

3. **Format Cleaning:**
   - Remove spaces, hyphens, and other formatting before validation
   - Example: "12-34-56" → "123456" → validate as 6 digits

4. **Regex Patterns:**
   - UK Postcode: `/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i`
   - Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Phone: `/^[+]?[0-9 ()-]{7,15}$/`
   - Sort Code: `/^[0-9]{6}$/` (after cleaning)
   - Account Number: `/^[0-9]{8}$/`
   - UTR: `/^[0-9]{10}$/` (after cleaning spaces)
   - IBAN: `/^[A-Z]{2}[0-9A-Z\s]+$/i` + length check
   - SWIFT: `/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i`
   - VAT: `/^[0-9]{9,12}$/` (after removing GB prefix and spaces)

---

## Testing Instructions

### Test Case 1: UTR Number Validation
1. Go to Section 6
2. Select "CIS Registered: Yes"
3. Enter UTR: "12" (invalid - too short)
4. Try to proceed to Section 7
5. ✅ Expected: Error "UTR Number (must be exactly 10 digits)"
6. Enter UTR: "1234567890" (valid)
7. ✅ Expected: No error, can proceed

### Test Case 2: Sort Code Validation
1. Go to Section 6
2. Select "Overseas Supplier: No"
3. Enter Sort Code: "1234" (invalid - too short)
4. Try to proceed to Section 7
5. ✅ Expected: Error "Sort Code (must be exactly 6 digits)"
6. Enter Sort Code: "12-34-56" (valid, will be cleaned to 123456)
7. ✅ Expected: No error, can proceed

### Test Case 3: IBAN Validation
1. Go to Section 6
2. Select "Overseas Supplier: Yes"
3. Enter IBAN: "1234" (invalid - too short, wrong format)
4. Try to proceed to Section 7
5. ✅ Expected: Error "IBAN (must be 15-34 characters)" or "IBAN (invalid format...)"
6. Enter IBAN: "GB29NWBK60161331926819" (valid)
7. ✅ Expected: No error, can proceed

### Test Case 4: Email Validation
1. Go to Section 1
2. Enter NHS Email: "test@gmail.com" (invalid - not NHS domain)
3. Try to proceed to Section 2
4. ✅ Expected: Error "NHS Email (must be an NHS email address)"
5. Enter NHS Email: "test@nhs.net" (valid)
6. ✅ Expected: No error, can proceed

### Test Case 5: Postcode Validation
1. Go to Section 4
2. Enter Postcode: "12345" (invalid - not UK format)
3. Try to proceed to Section 5
4. ✅ Expected: Error "Postcode (invalid UK postcode format)"
5. Enter Postcode: "EC1A 1BB" (valid)
6. ✅ Expected: No error, can proceed

### Test Case 6: VAT Number Validation
1. Go to Section 6
2. Select "VAT Registered: Yes"
3. Enter VAT: "123" (invalid - too short)
4. Try to proceed to Section 7
5. ✅ Expected: Error "VAT Number (must be 9 or 12 digits after optional GB prefix)"
6. Enter VAT: "GB123456789" (valid)
7. ✅ Expected: No error, can proceed

### Test Case 7: Comprehensive Validation
1. Fill out entire form with INVALID data:
   - Section 1: NHS Email: "test@gmail.com"
   - Section 3: CRN: "12" (if limited company)
   - Section 4: Postcode: "12345"
   - Section 6: UTR: "12", Sort Code: "1234", Account Number: "123"
2. Navigate to Section 7
3. ✅ Expected: Multiple validation errors listed, cannot submit
4. Fix all errors with valid data
5. ✅ Expected: All sections green, can submit successfully

---

## Impact on User Experience

### Before Fix (BAD UX ❌)
- User enters invalid data
- Form allows them to proceed through all sections
- Reaches Section 7, clicks submit
- Form submitted with invalid data
- **Payment fails** or **system rejects submission**
- User has to go back and fix (frustration)

### After Fix (GOOD UX ✅)
- User enters invalid data
- Form **immediately shows error** when trying to proceed
- Error message is **clear and specific**: "UTR Number (must be exactly 10 digits)"
- User fixes error before proceeding
- By the time they reach Section 7, **all data is valid**
- Submission succeeds on first attempt

---

## Benefits

### 1. Data Quality
- No invalid banking details (prevents payment failures)
- No malformed IBANs, SWIFT codes (prevents integration errors)
- No invalid VAT/UTR numbers (prevents compliance issues)

### 2. User Experience
- Clear, immediate feedback
- Specific error messages guide users to fix issues
- Reduces frustration from failed submissions

### 3. System Reliability
- Fewer failed payments
- Fewer support tickets
- Fewer data correction requests

### 4. Compliance
- Ensures all financial data meets regulatory formats
- Reduces audit findings
- Maintains data standards

---

## Validation Rules Summary

| Field | Format | Example Valid | Example Invalid |
|-------|--------|---------------|-----------------|
| NHS Email | @nhs.net, @bartshealth.nhs.uk, etc. | test@nhs.net | test@gmail.com |
| Phone | UK format, 7-15 chars | 020 7946 0958 | 123 |
| Postcode | UK postcode format | EC1A 1BB | 12345 |
| CRN | 7-8 digits | 02559707 | 123 |
| Sort Code | 6 digits | 12-34-56 | 1234 |
| Account Number | 8 digits | 12345678 | 123 |
| IBAN | 15-34 chars, starts with country code | GB29NWBK60161331926819 | 1234 |
| SWIFT | 8 or 11 chars, valid format | ABCDGB2LXXX | ABC123 |
| Bank Routing | 9 digits | 123456789 | 1234 |
| UTR | 10 digits | 1234567890 | 12 |
| DUNS | 9 digits | 123456789 | 1234 |
| VAT | 9 or 12 digits after GB | GB123456789 | 123 |

---

## Related Security Fixes

This validation fix complements other security measures:

### SEC-03: Sensitive Data Exclusion
- Bank details excluded from localStorage
- Validation ensures only valid data enters system

### PDF Security Fix
- PDFs don't expose banking details
- Validation ensures data in secure storage is valid

### Upload Validation Fix
- Files validated and persisted correctly
- Format validation ensures data integrity

---

## Deployment Priority

**Priority:** 🔴 **CRITICAL - DEPLOY IMMEDIATELY**

**Why Critical:**
- Currently allows invalid data into system
- Can cause payment failures
- Creates data quality issues
- User frustration from failed submissions

**Testing Required Before Deployment:**
- Test all validation rules (see testing instructions above)
- Verify error messages are clear and helpful
- Ensure no false positives (valid data rejected)
- Test edge cases (formatting variations like "12-34-56" for sort code)

---

## Summary

### Changes Made: ✅ COMPLETE

1. ✅ Section 1: Email, phone, name length validation
2. ✅ Section 2: Justification length validation
3. ✅ Section 3: CRN, charity number, annual value validation
4. ✅ Section 4: Postcode, email, phone, website validation
5. ✅ Section 5: Service type count, description length validation
6. ✅ Section 6: Banking details format validation (CRITICAL)
   - Sort Code, Account Number, IBAN, SWIFT, Bank Routing
   - UTR, DUNS, VAT number formats
   - Public Liability expiry date validation
   - Accounts address fields validation

### Files Modified: 1
- `src/stores/formStore.js` - `getMissingFields` function

### Validation Improvements: 40+ fields
- All fields now have comprehensive format validation
- Clear, specific error messages
- Prevents invalid data submission

---

*Critical fix completed: February 6, 2026*
*Priority: CRITICAL*
*Status: Ready for immediate deployment*
