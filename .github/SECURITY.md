# Security Policy

## Reporting Security Vulnerabilities

**NHS Barts Health Trust takes security seriously.**

If you discover a security vulnerability in the NHS Supplier Setup Smart Form, please report it responsibly:

### 🔒 How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead:
1. **Email:** Contact the development team directly at your NHS IT security contact
2. **Subject:** Use "SECURITY: NHS Supplier Form Vulnerability"
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### ⚡ Response Time

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 5 business days
- **Fix Timeline:** Depends on severity (critical issues prioritized)

### 🛡️ Supported Versions

| Version | Supported |
|---------|-----------|
| 2.0.x (Current) | ✅ Yes |
| 1.0.x | ❌ No longer supported |

### 🔐 Security Features

This application includes:

- ✅ **Azure AD Authentication** - Enterprise SSO
- ✅ **Role-Based Access Control (RBAC)** - 6 security groups
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **CSRF Protection** - Cross-site request forgery prevention
- ✅ **Input Validation** - Server and client-side validation
- ✅ **Audit Logging** - Complete action trail
- ✅ **Data Encryption** - At rest and in transit
- ✅ **Document Security** - DLP-compliant storage
- ✅ **Session Security** - HttpOnly cookies, 8-hour expiration

See [PRODUCTION_FIXES_2026-02-04.md](../docs/archive/PRODUCTION_FIXES_2026-02-04.md) for details of security updates.

### 📋 Security Checklist

Before deployment, ensure:

- [ ] All environment variables are properly configured
- [ ] Azure AD security groups are created
- [ ] SQL Server TDE encryption is enabled
- [ ] HTTPS is enforced in production
- [ ] Session secrets are rotated
- [ ] Audit logs are monitored
- [ ] SharePoint permissions are correctly set

See [PRODUCTION_DEPLOYMENT_CHECKLIST.md](../docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) for complete checklist.

---

**Last Updated:** February 5, 2026
**Security Contact:** NHS Barts Health IT Security Team
