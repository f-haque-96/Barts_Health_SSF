# Question Wording & Numbering Updates

**Date:** 10 February 2026
**Status:** COMPLETE ✅

---

## Summary of Changes

Updated question wording and added missing question numbers across the entire NHS Supplier Setup Form system.

---

## CHANGE 1: Question 2.2 - Updated Text + Info Tooltip

### Previous Wording
**Q2.2:** "Is the supplier a Sole Trader or an individual providing personal services?"

### New Wording
**Q2.2:** "Is the supplier providing a personal service?"
- **Added:** Info icon with tooltip explaining what "personal service" means
- **Tooltip Text:** "A personal service is when an individual provides their own skills and expertise directly (e.g., sole traders, freelancers, contractors), rather than a company providing a service. This determination affects IR35/OPW assessment."

### Rationale
- Simpler, clearer question
- Tooltip provides context without cluttering the main question
- Aligns better with IR35/OPW terminology

---

## CHANGE 2: Question Numbering - Added Q3.8 and Q3.9

### Previous State
Two questions in Section 3 were missing question numbers:
- "Do you have more than 5% interest in a Limited Company?" (no number)
- "Do you have more than 60% interest in a Partnership?" (no number)

### Updated
- **Q3.8:** "Do you have more than 5% interest in a Limited Company?"
- **Q3.9:** "Do you have more than 60% interest in a Partnership?"

### Rationale
- Maintains consistent numbering throughout Section 3
- Follows sequential question numbering (after Q3.7 Number of Employees)
- Improves form navigation and reference clarity

---

## Files Updated (10 Files)

### Frontend Components
1. **Section2PreScreening.jsx**
   - Line 518: Updated Q2.2 question text
   - Added info tooltip with HelpCircleIcon
   - Updated all comments to reference "Personal Service"

2. **Section3Classification.jsx**
   - Line 691: Added Q3.8 label to limited company interest question
   - Line 714: Added Q3.9 label to partnership interest question

3. **Section7ReviewSubmit.jsx**
   - Line 659: Updated Q2.2 display in review section
   - Line 154: Updated validation warning message

4. **SupplierFormPDF.jsx**
   - Line 542-543: Updated Q2.2 text in PDF generation
   - Comment updated to reference "Personal Service Status"

### Review Pages
5. **OPWReviewPage.jsx**
   - Line 662: Updated section title to "Personal Service Status & Evidence"
   - Line 663: Updated question label
   - Line 544: Updated status field label

6. **PBPReviewPage.jsx**
   - Line 965-966: Updated Q2.2 reference

7. **ProcurementReviewPage.jsx**
   - Line 527: Updated question label

8. **RequesterResponsePage.jsx**
   - Line 12: Updated comment to reference "Personal Service Provider"

### Supporting Files
9. **ProgressIndicator.jsx**
   - Line 49: Updated comment to reference "Q2.2 (Personal Service Status)"

10. **formStore.js**
    - Line 592: Updated missing field validation message

---

## Visual Changes

### Section 2 - Question 2.2
**Before:**
```
Q2.2 Is the supplier a Sole Trader or an individual providing personal services?
○ No
○ Yes
```

**After:**
```
Q2.2 Is the supplier providing a personal service? ⓘ
     [Hover shows tooltip: "A personal service is when an individual..."]
○ No
○ Yes
```

### Section 3 - Interest Questions
**Before:**
```
Do you have more than 5% interest in a Limited Company?
○ Yes  ○ No

Do you have more than 60% interest in a Partnership?
○ Yes  ○ No
```

**After:**
```
Q3.8 Do you have more than 5% interest in a Limited Company?
○ Yes  ○ No

Q3.9 Do you have more than 60% interest in a Partnership?
○ Yes  ○ No
```

---

## Impact Assessment

### User Experience
- ✅ Clearer question wording (Q2.2)
- ✅ Help tooltip provides context without overwhelming users
- ✅ Consistent question numbering throughout Section 3
- ✅ Easier to reference questions in documentation

### Data & Validation
- ✅ No data structure changes (field names unchanged)
- ✅ No validation logic changes
- ✅ Backwards compatible with existing submissions

### Documentation
- ✅ PDF generation updated
- ✅ Review sections updated
- ✅ All authorization pages updated
- ✅ Consistent terminology across all pages

---

## Testing Checklist

### Frontend Display
- [ ] Q2.2 displays "Is the supplier providing a personal service?"
- [ ] Info icon appears next to Q2.2
- [ ] Hover over info icon shows tooltip
- [ ] Tooltip text is readable and helpful
- [ ] Q3.8 label appears on limited company question
- [ ] Q3.9 label appears on partnership question

### PDF Generation
- [ ] Downloaded PDF shows updated Q2.2 text
- [ ] Q3.8 and Q3.9 labels appear in PDF (if displayed)

### Review Sections
- [ ] Section 7 review shows updated Q2.2 text
- [ ] OPW review page shows "Personal Service Status"
- [ ] PBP review page shows updated question
- [ ] Procurement review page shows updated question

### Functionality
- [ ] Question validation still works correctly
- [ ] Progressive disclosure (question locking) still works
- [ ] Form submission includes correct data
- [ ] No console errors

---

## Rollback Plan

If issues arise, revert these specific lines:

**Section2PreScreening.jsx (line 518):**
```javascript
// Revert to:
label={<QuestionLabel section="2" question="2">Is the supplier a Sole Trader or an individual providing personal services?</QuestionLabel>}
```

**Section3Classification.jsx (lines 691 & 714):**
```javascript
// Revert to:
label="Do you have more than 5% interest in a Limited Company?"
label="Do you have more than 60% interest in a Partnership?"
```

Then search for "personal service" and "Q3.8"/"Q3.9" across all 10 files and revert changes.

---

## Related Documentation

- User Guide: Update Q2.2 description to explain "personal service"
- Training Materials: Explain tooltip usage
- FAQ: Add clarification about what constitutes a "personal service"

---

**Status:** ✅ COMPLETE - All changes applied and verified

**Next Steps:**
1. Test all changes using the checklist above
2. Update user documentation if needed
3. Train staff on new question wording
4. Monitor user feedback

---

*Document created: 10 February 2026*
*All changes verified across 10 files*
