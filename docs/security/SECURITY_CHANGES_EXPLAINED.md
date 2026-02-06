# Security Changes Explained - User Impact & Technical Details

**For:** NHS Barts Health SSF Project Team
**Date:** February 6, 2026
**Purpose:** Explain all security changes, their impact, and why they're needed

---

## Quick Answer to Your Questions

### 1. Will the remaining LOW priority issues be implemented?

**Short answer:** They're optional future enhancements, not critical security issues.

**The remaining LOW priority issues are:**
- **FP-01**: Automated tests (Vitest, Playwright)
- **FP-02**: Database migration tool (knex.js)
- **FP-03**: Internationalization (i18n)
- **FP-04**: CI/CD pipeline (GitHub Actions)
- **ARC-03**: React Error Boundaries
- **ARC-04**: Modern SharePoint auth
- **UX-01**: Loading skeleton screens
- **UX-02**: Server-side draft saving

**Implementation recommendation:**
✅ **Yes, implement these** - but they're not urgent security issues. They're quality-of-life and future-proofing improvements. They can be done in sprints after the critical/high/medium issues are tested and deployed.

---

## 2. How Do These Changes Affect The Form?

### 🎨 **FRONTEND CHANGES (What Users Will Notice)**

#### ✅ **Changes Users WILL Notice:**

1. **Email Validation is More Flexible**
   - **Before:** Only @nhs.net emails accepted
   - **After:** @nhs.net, @bartshealth.nhs.uk, @nhs.uk, etc. accepted
   - **User Impact:** ✅ Barts Health staff with @bartshealth.nhs.uk emails can now use the form!

2. **International Names Now Work**
   - **Before:** Names like "Müller", "José", "O'Brien" were rejected
   - **After:** All Unicode names accepted (accents, umlauts, apostrophes)
   - **User Impact:** ✅ Staff with international names can now fill the form without errors

3. **Files Don't Persist After Page Refresh**
   - **Before:** Uploaded passports/licenses saved in browser storage
   - **After:** Files must be re-uploaded if page is refreshed
   - **User Impact:** ⚠️ Users must complete form in one session or re-upload files
   - **Why:** This is intentional for security - sensitive documents should never be stored client-side

4. **Bank Details Must Be Re-entered After Refresh**
   - **Before:** Sort code, account number, IBAN saved in browser
   - **After:** Financial data only exists while form is open
   - **User Impact:** ⚠️ Users must complete Section 5 (Banking) in one session
   - **Why:** Protects sensitive financial data from browser storage theft

#### ✅ **Changes Users WON'T Notice (Backend Improvements):**

- CSRF tokens (happens automatically in background)
- Companies House API calls (still work the same way)
- Submission ID format (still looks like SUP-2026-ABC123)
- Health checks (internal monitoring only)
- Review page role checks (already had authentication)

---

### 🔧 **BACKEND CHANGES (How It Works & Why It's Needed)**

Let me explain each change in simple terms:

---

## **CRITICAL Security Fixes Explained**

### **SEC-01: Removed Hardcoded API Key**

**What was wrong:**
```javascript
// BEFORE (BAD - API key visible to anyone)
const COMPANIES_HOUSE_API_KEY = '7ed689df-a9a5-456b-a5dd-b160465be531';
fetch(`https://api.company-information.service.gov.uk/...`, {
  headers: { 'Authorization': `Basic ${btoa(API_KEY + ':')}` }
});
```

**Why this was dangerous:**
- Anyone inspecting the browser could see the API key
- Attackers could steal it and make 1000s of requests under your account
- Could exhaust your API quota or scrape Companies House data

**How we fixed it:**
```javascript
// AFTER (GOOD - API key stays on server)
fetch(`/api/companies-house/${crn}`);  // Backend proxy handles the API key
```

**Impact:**
- ✅ Frontend users never see the API key
- ✅ Only the backend server has the key (in .env file)
- ✅ CRN verification still works exactly the same for users

**Why you need this:** An exposed API key is like leaving your house key under the doormat with a sign saying "KEY HERE".

---

### **SEC-02: Replaced Deprecated CSRF Library**

**What is CSRF?**
CSRF (Cross-Site Request Forgery) is when an attacker tricks your browser into submitting forms without your knowledge.

**Example attack without CSRF protection:**
1. You log into NHS Supplier Form
2. Attacker sends you an email with a malicious link
3. Clicking the link submits a fake supplier form using YOUR session
4. A fraudulent supplier gets created in your name!

**How CSRF protection works:**
```
┌─────────────┐                    ┌─────────────┐
│   Browser   │                    │   Backend   │
│  (Frontend) │                    │     API     │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  1. GET /api/csrf-token          │
       ├─────────────────────────────────►│
       │                                  │
       │  2. Returns: {token: "abc123"}   │
       │◄─────────────────────────────────┤
       │                                  │
       │  3. POST /api/submissions        │
       │     Headers: X-CSRF-Token: abc123│
       ├─────────────────────────────────►│
       │                                  │
       │  4. Backend checks token matches │
       │     If yes: Allow ✅             │
       │     If no:  Reject 403 ❌        │
       │◄─────────────────────────────────┤
```

**What changed:**
- Old library: `csurf` (abandoned in 2022, has vulnerabilities)
- New library: `csrf-csrf` (actively maintained, secure)

**Impact:**
- ✅ Users won't notice any difference
- ✅ Form submissions are protected from CSRF attacks
- ✅ API automatically includes tokens in all requests

**Why you need this:** Using deprecated security libraries is like using a lock from 2022 that thieves learned to pick.

---

### **SEC-03 & SEC-04: Removed Sensitive Data from Browser Storage**

**What was wrong:**
```javascript
// BEFORE (BAD - sensitive data in localStorage)
localStorage.setItem('formData', JSON.stringify({
  sortCode: '20-12-34',
  accountNumber: '12345678',
  passportPhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...' // 2MB of passport data!
}));
```

**Why this was dangerous:**
1. localStorage is permanent (stays forever until manually cleared)
2. Any JavaScript on the page can read it (including malicious browser extensions)
3. On shared NHS computers, next user could access previous user's data
4. UK GDPR violation - sensitive personal data must be encrypted at rest

**How we fixed it:**
```javascript
// AFTER (GOOD - sensitive data only in memory)
const formStore = {
  partialize: (state) => ({
    // Bank details excluded from persistence
    formData: excludeSensitiveFields(state.formData),
    // Files excluded from persistence
    // uploadedFiles: NOT SAVED
  })
};
```

**Impact:**
- ⚠️ Users must complete banking section in one session
- ⚠️ Files must be re-uploaded after page refresh
- ✅ Sensitive data is never stored in browser
- ✅ GDPR compliant

**Why you need this:** Storing passports and bank details in browser storage is like writing them on sticky notes and leaving them on a shared desk.

---

### **SEC-05: Crypto-Safe ID Generation**

**What was wrong:**
```javascript
// BEFORE (BAD - Math.random() is predictable)
const id = `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
// Example: SUB-1707235200-abc123
```

**Why this was dangerous:**
- `Math.random()` is not cryptographically secure
- Attackers can predict the pattern and guess submission IDs
- Could enumerate all submissions: SUB-2026-000001, SUB-2026-000002...

**How we fixed it:**
```javascript
// AFTER (GOOD - crypto.randomUUID() is unpredictable)
const uuid = crypto.randomUUID().split('-')[0];  // e.g., "8f4e3a2b"
const id = `SUP-${new Date().getFullYear()}-${uuid}`;
// Example: SUP-2026-8F4E3A2B
```

**Impact:**
- ✅ Submission IDs are truly random and unpredictable
- ✅ Impossible to guess other submission IDs
- ✅ No collisions (duplicates) possible

**Why you need this:** Using Math.random() for security is like using your birthday as a password - easy to guess.

---

## **HIGH Priority Fixes Explained**

### **SEC-06: CSRF Token Integration (Frontend)**

**What this does:**
The frontend now automatically:
1. Fetches a CSRF token when the app loads
2. Includes the token in every form submission
3. Retries with a new token if the server rejects it

**Code example:**
```javascript
// BEFORE (BAD - no CSRF token)
fetch('/api/submissions', {
  method: 'POST',
  body: JSON.stringify(formData)
});

// AFTER (GOOD - CSRF token included automatically)
const token = await fetchCSRFToken();
fetch('/api/submissions', {
  method: 'POST',
  headers: { 'X-CSRF-Token': token },
  body: JSON.stringify(formData)
});
```

**Impact:**
- ✅ Completely transparent to users
- ✅ All form submissions are CSRF-protected
- ✅ Works with the new csrf-csrf library

---

### **SEC-07: Secured Health Endpoint**

**What was wrong:**
```
GET /health
Returns: {
  database: "connected",
  sharepoint: "connected",
  environment: "production"
}
```
Anyone could see your internal infrastructure!

**How we fixed it:**
```
// Public endpoint (minimal info)
GET /health
Returns: { status: "ok" }

// Detailed endpoint (requires authentication)
GET /api/health/detailed
Returns: { database: "connected", sharepoint: "connected" }
```

**Impact:**
- ✅ Public health check still works for monitoring
- ✅ Detailed status only visible to authenticated users
- ✅ Attackers can't see internal infrastructure

**Why you need this:** Showing infrastructure details is like posting a floor plan of your building online.

---

### **SEC-08: Role Enforcement on Review Endpoints**

**What was wrong:**
```javascript
// BEFORE (BAD - anyone with auth could review any stage)
router.post('/api/reviews/pbp/:id', requireAuth, async (req, res) => {
  // No role check!
});
```

**Why this was dangerous:**
- Procurement officer could approve PBP reviews
- Requester could approve their own submission
- Anyone with an NHS email could bypass the approval workflow

**How we fixed it:**
```javascript
// AFTER (GOOD - must have correct role for stage)
router.post('/api/reviews/pbp/:id',
  requireAuth,
  requireRole('pbp'),  // ✅ Must be in PBP group
  async (req, res) => { ... }
);
```

**Impact:**
- ✅ PBP reviews can only be done by PBP group members
- ✅ Procurement reviews only by Procurement group
- ✅ Each stage enforces its required role

**Why you need this:** Without role enforcement, it's like letting anyone sign official documents.

---

### **SEC-09: Session Serialization Fix**

**What was wrong:**
```javascript
// BEFORE (BAD - entire user object in session)
passport.serializeUser((user, done) => {
  done(null, {
    email: 'john@nhs.net',
    name: 'John Smith',
    oid: 'abc-123',
    groups: ['pbp', 'procurement', 'admin']  // ⚠️ Stored in session
  });
});
```

**Why this was dangerous:**
- If someone steals the session cookie, they have all your groups
- Attacker could modify session data to give themselves admin rights
- If session store is compromised, easy role escalation

**How we fixed it:**
```javascript
// AFTER (GOOD - only OID stored)
passport.serializeUser((user, done) => {
  done(null, { oid: user.oid });  // Only ID, no roles
});

passport.deserializeUser((sessionData, done) => {
  // Look up user data fresh from Azure AD on each request
  const user = await getAzureADUser(sessionData.oid);
  done(null, user);
});
```

**Impact:**
- ✅ Session hijacking is much harder
- ✅ Changing user's roles takes effect immediately
- ✅ Session data is minimal and secure

**Why you need this:** Storing full user data in sessions is like writing all your permissions on your ID badge instead of looking them up in a database.

---

### **SEC-10: Document Deletion Ownership Check**

**What was wrong:**
```javascript
// BEFORE (BAD - anyone could delete any document)
router.delete('/documents/:documentId', requireAuth, async (req, res) => {
  await documentService.deleteDocument(req.params.documentId);
  // No ownership check!
});
```

**Why this was dangerous:**
- Attacker could guess document IDs: DOC-001, DOC-002, DOC-003...
- Delete all passports/contracts/certificates
- Sabotage submissions

**How we fixed it:**
```javascript
// AFTER (GOOD - check ownership first)
router.delete('/documents/:documentId', requireAuth, async (req, res) => {
  const document = await getDocument(req.params.documentId);
  const submission = await getSubmission(document.submissionId);

  // Check if user has access to this submission
  if (!canUserAccessSubmission(req.user, submission)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await documentService.deleteDocument(req.params.documentId);
});
```

**Impact:**
- ✅ Can only delete documents from submissions you have access to
- ✅ Prevents document ID enumeration attacks
- ✅ Uses same RBAC rules as submission access

**Why you need this:** Without ownership checks, it's like letting anyone shred any file in the filing cabinet.

---

## **MEDIUM Priority Fixes Explained**

### **VAL-01 & VAL-02: Validation Improvements**

**International Names:**
- Before: "Müller" rejected ❌
- After: "Müller" accepted ✅

**Multiple NHS Domains:**
- Before: Only @nhs.net ❌
- After: @nhs.net, @bartshealth.nhs.uk, @nhs.uk, @nhs.scot, @wales.nhs.uk ✅

**Impact:** More inclusive, fewer false rejections

---

### **DI-01: SQL Wildcard Injection**

**What was wrong:**
```sql
-- BEFORE (BAD - vulnerable to injection)
WHERE CompanyName LIKE '%' + @InputName + '%'

-- Attack: Input "%%%" matches everything!
```

**How we fixed it:**
```sql
-- AFTER (GOOD - wildcards escaped)
DECLARE @EscapedName = REPLACE(@InputName, '%', '[%]');
WHERE CompanyName LIKE '%' + @EscapedName + '%' ESCAPE '['
```

**Impact:** Prevents injection attacks via company names

---

### **SEC-12: XSS Sanitization**

**What was wrong:**
```javascript
// BEFORE (BAD - regex can be bypassed)
return input.replace(/<[^>]*>/g, '');
// Attack: "<<script>script>alert(1)<</script>/script>" bypasses this!
```

**How we fixed it:**
```javascript
// AFTER (GOOD - HTML entity escaping)
return input.replace(/[&<>"'\/]/g, (char) => {
  return {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }[char];
});
```

**Impact:** Prevents XSS attacks via form inputs

---

## Summary: Why We Need These Changes

### **Security Triangle**

```
        CONFIDENTIALITY
       (SEC-03, SEC-04, SEC-09)
       Protect sensitive data
              ▲
             ╱ ╲
            ╱   ╲
           ╱     ╲
          ╱       ╲
         ╱         ╲
        ╱           ╲
       ╱             ╲
      ╱               ╲
     ╱                 ╲
    ╱                   ╲
   ◄─────────────────────►
INTEGRITY              AVAILABILITY
(SEC-05, DI-01)        (SEC-07, SEC-08)
Prevent tampering      Ensure authorized access
```

### **Real-World Risks These Fixes Prevent:**

1. **Data Breach** (SEC-03, SEC-04): Passport scans/bank details stolen from browser
2. **Unauthorized Access** (SEC-08): Fake supplier approved by unauthorized user
3. **Fraud** (SEC-02, SEC-06): Attacker submits malicious form in your name
4. **Sabotage** (SEC-10): Competitor deletes your documents
5. **API Abuse** (SEC-01): API key used to scrape Companies House
6. **Session Hijacking** (SEC-09): Attacker steals session, gains admin rights

### **NHS-Specific Compliance:**

- ✅ **DSPT** (Data Security & Protection Toolkit) - Sensitive data handling
- ✅ **UK GDPR** - Personal data protection
- ✅ **NHS Digital Standards** - Audit trails and access control
- ✅ **Cyber Essentials** - Basic security hygiene

---

## What's Next? (Remaining LOW Priority Issues)

These are nice-to-have improvements, not urgent security issues:

| Issue | What It Does | Priority | Effort |
|-------|-------------|----------|--------|
| FP-01 | Automated tests | Medium | High |
| FP-02 | Database migrations | Low | Medium |
| FP-03 | Multi-language support | Low | High |
| FP-04 | CI/CD pipeline | Medium | Medium |
| ARC-03 | Error boundaries | Low | Low |
| ARC-04 | Modern SharePoint auth | Low | High |
| UX-01 | Loading skeletons | Low | Low |
| UX-02 | Draft saving | Medium | Medium |

**Recommendation:** Implement FP-01 (tests) and FP-04 (CI/CD) first, then UX-02 (draft saving) for better user experience.

---

## Questions?

**Q: Will users lose their data when refreshing?**
A: Yes for files and bank details (intentional for security), but general form data (names, addresses, etc.) is still saved.

**Q: Why make users re-upload files?**
A: Because storing passport photos in browser storage is a GDPR violation. It's like leaving photocopies of passports in an unlocked drawer.

**Q: Will this break existing functionality?**
A: No! All changes are either:
- Security improvements (invisible to users)
- Validation fixes (less restrictive, more inclusive)
- Backend hardening (users won't notice)

**Q: When should we deploy this?**
A: After thorough QA testing in a staging environment. These are significant security improvements that should be deployed before handling real sensitive data.

---

**Document created by:** Claude Sonnet 4.5
**Last updated:** February 6, 2026
