# Development Authentication Guide

## Quick Fix - You Now Have Admin Access!

Your test authorization pages should now work! The development user has been configured with full admin access.

## What Was Fixed

The issue was that the test user's security groups didn't match the expected Azure AD group names. The system was looking for groups like `NHS-SupplierForm-Admin`, but the test user had groups like `Procurement-Team`.

**Fixed in:**
- `src/services/StorageProvider.js` - Now uses proper AD group names
- `src/config/devAuth.js` - New configuration file for easy role switching

## Testing Different Roles

You can now easily test different user roles by editing `src/config/devAuth.js`:

### Switch Between User Profiles

1. Open `src/config/devAuth.js`
2. Change the `ACTIVE_TEST_USER` constant
3. Refresh your browser

```javascript
// Current setting - Full admin access
export const ACTIVE_TEST_USER = 'ADMIN';

// Change to one of these to test specific roles:
// 'ADMIN'        - Full access to everything
// 'PROCUREMENT'  - Procurement review only
// 'AP_CONTROL'   - AP Control review only
// 'PBP'          - Pre-Buy Panel review only
// 'OPW'          - Off-Payroll Working review only
// 'CONTRACT'     - Contract team only
// 'MULTI_ROLE'   - Multiple roles (Procurement + AP Control)
// 'REQUESTER'    - No special access (regular user)
```

## Available Review Pages

With admin access, you can now access all review pages:

### Development URLs (with test data)
- **Procurement Review**: `http://localhost:5173/review/procurement/SUP-2026-12345`
- **PBP Review**: `http://localhost:5173/review/pbp/SUP-2026-12345`
- **OPW Review**: `http://localhost:5173/review/opw/SUP-2026-12345`
- **AP Control Review**: `http://localhost:5173/review/ap-control/SUP-2026-12345`

*(Note: You'll need to create test submissions first - the ID should match a submission in localStorage)*

## How Authentication Works

### Development Mode (Current)
- Uses `LocalStorageProvider`
- Test user defined in `devAuth.js`
- No real Azure AD required
- Perfect for testing and development

### Production Mode
- Uses `ApiStorageProvider`
- Requires backend API with Azure AD integration
- User groups from real Azure AD security groups
- Full RBAC enforcement

## Creating Test Submissions for Review

To test the review pages, you need submissions with the correct status:

### Option 1: Create via the Form
1. Fill out and submit a supplier form
2. Note the submission ID (e.g., SUP-2026-12345)
3. Open browser DevTools → Application → Local Storage
4. Find `submission_SUP-2026-12345`
5. Edit the JSON to change status:
   ```json
   {
     "status": "pending_procurement_review",
     "currentStage": "procurement"
   }
   ```
6. Visit: `http://localhost:5173/review/procurement/SUP-2026-12345`

### Option 2: Create Test Data Manually
```javascript
// In browser console:
const testSubmission = {
  id: 'SUP-2026-TEST1',
  submissionId: 'SUP-2026-TEST1',
  status: 'pending_procurement_review',
  currentStage: 'procurement',
  formData: {
    section1: {
      firstName: 'Test',
      lastName: 'User',
      nhsEmail: 'test@nhs.net'
    },
    section3: {
      supplierType: 'limited_company',
      companyName: 'Test Company Ltd'
    }
  }
};
localStorage.setItem('submission_SUP-2026-TEST1', JSON.stringify(testSubmission));
```

Then visit: `http://localhost:5173/review/procurement/SUP-2026-TEST1`

## Status Values for Different Stages

Use these status values to test different review pages:

| Review Page | Status | Current Stage |
|-------------|--------|---------------|
| PBP | `pending_pbp_review` | `pbp` |
| Procurement | `pending_procurement_review` | `procurement` |
| OPW | `pending_opw_review` | `opw` |
| Contract | `pending_contract` | `contract` |
| AP Control | `pending_ap_control` | `ap_control` |

## Security Groups Reference

These are the Azure AD groups the system expects (defined in `AuthContext.jsx`):

| Role | AD Group Name | Access Level |
|------|---------------|--------------|
| Admin | `NHS-SupplierForm-Admin` | All review pages |
| PBP | `NHS-SupplierForm-PBP` | Pre-Buy Panel reviews |
| Procurement | `NHS-SupplierForm-Procurement` | Procurement reviews |
| OPW | `NHS-SupplierForm-OPW` | Off-Payroll reviews |
| Contract | `NHS-SupplierForm-Contract` | Contract reviews |
| AP Control | `NHS-SupplierForm-APControl` | AP Control reviews |

## Troubleshooting

### Still seeing "Access Denied"?
1. Check browser console for errors
2. Verify you refreshed after changing `devAuth.js`
3. Check localStorage for session data: `localStorage.getItem('session')`
4. Verify the submission status matches the review page

### "Submission not found"?
1. Check the submission ID exists in localStorage
2. View all submissions:
   ```javascript
   Object.keys(localStorage).filter(k => k.startsWith('submission_'))
   ```

### Want to reset everything?
```javascript
// Clear all localStorage data
localStorage.clear();
```

## Production Setup

When deploying to production:
1. Set `VITE_USE_API=true` in `.env`
2. Set up Azure AD App Registration
3. Create AD security groups
4. Assign users to groups
5. The backend will validate group membership

The `devAuth.js` file is only used in development and won't affect production.

## Need Help?

The authentication system is in these files:
- `src/config/devAuth.js` - Test user configuration (EDIT THIS)
- `src/services/StorageProvider.js` - Data provider (uses devAuth)
- `src/context/AuthContext.jsx` - Role checking logic
- `src/components/common/ProtectedRoute.jsx` - Route protection
