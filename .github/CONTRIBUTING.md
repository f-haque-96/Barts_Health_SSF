# Contributing to NHS Supplier Setup Smart Form

Thank you for your interest in contributing to the NHS Supplier Setup Smart Form!

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork:** `git clone https://github.com/YOUR-USERNAME/Barts_Health_SSF.git`
3. **Create a branch:** `git checkout -b feature/your-feature-name`
4. **Make your changes**
5. **Test thoroughly**
6. **Commit:** `git commit -m "Description of changes"`
7. **Push:** `git push origin feature/your-feature-name`
8. **Open a Pull Request**

## 📋 Before You Start

1. Read [docs/getting-started/START_HERE.md](../docs/getting-started/START_HERE.md)
2. Check existing issues and PRs to avoid duplicates
3. Follow the project's code style (ESLint configuration included)

## 🐛 Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## ✨ Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and explain:
- The problem it solves
- Proposed solution
- User impact

## 💻 Development Guidelines

### Code Style
- Follow ESLint rules (run `npm run lint`)
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Component Guidelines
- Place reusable components in `src/components/common/`
- Export from `src/components/common/index.js`
- Include PropTypes or TypeScript types
- Write clear component documentation

### Git Commits
- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused on single changes

Example:
```
Fix rejection modal centering issue

- Changed justifyContent to justify-content in CSS
- Modal now displays centered on all screen sizes
- Fixes #123
```

## 🧪 Testing

Before submitting a PR:
1. Test your changes thoroughly
2. Ensure no console errors
3. Test on multiple browsers (Chrome, Edge, Firefox)
4. Verify responsive design (mobile, tablet, desktop)

## 📚 Documentation

When adding features:
- Update relevant documentation in `docs/`
- Add entries to [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) if needed
- Update README.md if it affects getting started

## 🔐 Security

**Never commit:**
- Passwords or API keys
- `.env` files with real credentials
- Personal or sensitive data

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## ✅ Pull Request Process

1. **Update documentation** to reflect changes
2. **Add yourself** to contributors if you haven't already
3. **Request review** from code owners (automatic)
4. **Address feedback** from reviewers
5. **Merge** will be done by maintainers after approval

## 📞 Need Help?

- **Questions:** Open a discussion or issue
- **Complex features:** Discuss approach before implementing
- **Stuck:** Ask for help in the issue or PR

---

**Thank you for contributing to healthcare technology! 🏥**
