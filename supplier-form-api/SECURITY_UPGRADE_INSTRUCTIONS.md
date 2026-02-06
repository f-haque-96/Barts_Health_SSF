# Security Upgrade Instructions

## CRITICAL: CSRF Library Replacement

The deprecated `csurf` package has been replaced with the maintained `csrf-csrf` library.

### Required Actions

1. **Uninstall the deprecated package:**
   ```bash
   npm uninstall csurf
   ```

2. **Install the new maintained package:**
   ```bash
   npm install csrf-csrf
   ```

3. **Verify installation:**
   ```bash
   npm list csrf-csrf
   ```

### What Changed

- **Old**: `csurf` (deprecated since September 2022, vulnerable)
- **New**: `csrf-csrf` (actively maintained, secure double-submit cookie pattern)

### Testing the Update

After installing the new package:

1. Start the backend API:
   ```bash
   cd supplier-form-api
   npm start
   ```

2. Test CSRF token endpoint:
   ```bash
   curl http://localhost:3001/api/csrf-token
   ```

3. Expected response:
   ```json
   {"csrfToken":"..."}
   ```

4. Test that POST requests without CSRF token are rejected:
   ```bash
   curl -X POST http://localhost:3001/api/submissions \
     -H "Content-Type: application/json" \
     -d '{"test":"data"}'
   ```

   Expected: HTTP 403 Forbidden

### Frontend Integration

The frontend code will be updated to fetch and include CSRF tokens in all state-changing requests. No changes are needed from developers - this is handled automatically by the API service layer.

### Rollback (if needed)

If issues occur:

1. Revert the code changes in `supplier-form-api/src/app.js`
2. Reinstall csurf: `npm install csurf`
3. Restart the API

However, this is **NOT RECOMMENDED** for production as csurf is unmaintained and vulnerable.

---

**Updated:** February 6, 2026
**Status:** REQUIRED before production deployment
