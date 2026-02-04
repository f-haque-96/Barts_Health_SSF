# CRN Verification Setup Guide

## Quick Start - Get CRN Verification Working

Your Companies House API key has been configured! Follow these steps to get CRN verification working:

### Step 1: Install Backend Dependencies

Open a terminal in the `supplier-form-api` folder and run:

```bash
cd supplier-form-api
npm install
```

### Step 2: Start the Backend API

In the same terminal:

```bash
npm run dev
```

You should see:
```
Server running on port 3001
```

**Keep this terminal window open!** The backend needs to stay running.

### Step 3: Start the Frontend (in a NEW terminal)

Open a **new terminal** in the main project folder:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 4: Test CRN Verification

1. Open the form in your browser: `http://localhost:5173`
2. Go to Section 3 (Classification)
3. Select "Yes" for Companies House registered
4. Enter a test CRN:
   - Try: `00445790` (Tesco PLC - should work)
   - Try: `04234715` (Sainsbury's - should work)

## What's Been Fixed

✅ Frontend now calls the correct backend endpoint: `GET /api/companies-house/:crn`
✅ Your API key is configured in the backend `.env` file
✅ Backend is set up to proxy Companies House API requests
✅ CORS is configured to allow frontend-backend communication

## Architecture

```
Frontend (localhost:5173)
    ↓
Backend API (localhost:3001/api/companies-house/:crn)
    ↓
Companies House API (using your API key)
```

## Troubleshooting

### "Network Error" or "Cannot connect"
- **Cause**: Backend API is not running
- **Fix**: Make sure you ran `npm run dev` in the `supplier-form-api` folder

### "404 Not Found"
- **Cause**: Invalid CRN or company doesn't exist
- **Fix**: Double-check the CRN format (6-8 characters, letters and numbers)

### "CORS Error"
- **Cause**: Frontend and backend origins mismatch
- **Fix**: Check that CORS_ORIGIN in `.env` matches your frontend URL

### "Unauthorized" or "Auth Error"
- **Note**: Currently authentication is bypassed for CRN lookup in development
- **Production**: Will require Azure AD authentication

## Your API Key

Your Companies House API key is configured in:
- File: `supplier-form-api/.env`
- Variable: `CH_API_KEY=d1e356cc-2181-4704-ad76-d2784ca5c917`

## Next Steps (Optional)

For full functionality, you'll eventually need to configure:
1. **Database** - SQL Server for storing submissions
2. **SharePoint** - For document storage
3. **Azure AD** - For authentication
4. **Session Secret** - Generate a secure secret for production

But for **CRN verification testing**, you only need:
- ✅ Companies House API key (already configured)
- ✅ Backend running (npm run dev)
- ✅ Frontend running (npm run dev)

## Testing Different Company Statuses

Test CRNs to see the verification badges:

| CRN | Company | Status | Badge |
|-----|---------|--------|-------|
| 00445790 | Tesco PLC | Active | Green "Verified" |
| 04234715 | Sainsbury's | Active | Green "Verified" |
| 01234567 | Test Dissolved Co. | Dissolved | Amber "Verification Needed" |

## Need Help?

If you still have issues:
1. Check both terminals are running (backend and frontend)
2. Check browser console for error messages (F12)
3. Check backend terminal for error messages
4. Verify your API key is valid on Companies House Developer Hub
