# 👋 START HERE - Beginner's Guide to the NHS Supplier Form

**Welcome!** This guide will help you understand and work with the NHS Supplier Setup Smart Form, even if this is your first time working on a project like this.

---

## 📚 Available Guides (Pick What You Need!)

### For Beginners (Start Here!)

1. **[This File - START_HERE.md](START_HERE.md)** 📍 *You are here!*
   - Overview of the project
   - Where to begin
   - What each guide is for

2. **[DEVELOPMENT_MODE_GUIDE.md](DEVELOPMENT_MODE_GUIDE.md)** 🛠️
   - How to work on the app on your computer
   - How test buttons work (they appear automatically!)
   - Very beginner-friendly

3. **[CRN_SETUP_GUIDE.md](CRN_SETUP_GUIDE.md)** 🏢
   - How company verification works
   - Test company numbers you can use
   - How to set up for real companies (optional)

### For Deployment (When Ready for Production)

4. **[PRODUCTION_DEPLOYMENT_CHECKLIST.md](../PRODUCTION_DEPLOYMENT_CHECKLIST.md)** ✅
   - Complete checklist before going live
   - Step-by-step instructions
   - What IT needs to configure

5. **[PRODUCTION_FIXES_2026-02-04.md](../PRODUCTION_FIXES_2026-02-04.md)** 🔧
   - What was fixed to make the app production-ready
   - Technical details of all changes

---

## 🚀 Quick Start - First Time Running the App

### What You Need

Before you start, make sure you have:
- [ ] Node.js installed on your computer
- [ ] Visual Studio Code (or any code editor)
- [ ] A terminal/command prompt

**Don't have these?** Ask your IT department to install them!

### Step 1: Open the Project

1. **Open your terminal** (Command Prompt on Windows, Terminal on Mac)

2. **Navigate to the project folder:**
   ```bash
   cd "c:\Users\haquefah\Downloads\Barts_Health_SSF-main (1)\Barts_Health_SSF-main"
   ```
   *(Adjust the path to where YOUR project is located)*

### Step 2: Install Dependencies (One-Time Setup)

**First time only**, run this command:
```bash
npm install
```

**What this does:** Downloads all the code libraries the project needs.
**How long:** 2-5 minutes
**When to do it:** Only once (or if someone tells you to update dependencies)

### Step 3: Start Development Mode

**Every time you want to work on the app**, run:
```bash
npm run dev
```

**What happens:**
- ✅ The app starts running on your computer
- ✅ Opens automatically in your browser
- ✅ Shows: `http://localhost:5173`
- ✅ Test buttons appear automatically at bottom of Section 7
- ✅ Any changes you make appear immediately!

**To stop it:** Press `Ctrl + C` in the terminal

---

## 🧪 Testing the App (Development Mode)

### Using Test Companies (No Setup Needed!)

The app has **4 test companies built-in** so you can test without setting up anything!

**Test company CRN numbers:**

| CRN | Company Name | Use For |
|-----|--------------|---------|
| `12345678` | Test Company Ltd | General testing |
| `00445790` | TESCO PLC | Real company example |
| `04234715` | SAINSBURY'S SUPERMARKETS LTD | Real company example |
| `01234567` | Dissolved Test Company Ltd | Testing error handling |

**How to use:**
1. Run `npm run dev`
2. Fill out the form to Section 4 (Supplier Details)
3. Enter one of the CRN numbers above
4. Click "Verify CRN"
5. Watch the company details automatically fill in! 🎉

### Using Test Buttons (Workflow Testing)

**Test buttons appear automatically** when you run `npm run dev`!

1. Fill out the form to Section 7 (Review & Submit)
2. Scroll to the bottom
3. You'll see a blue box with "Development Testing Tools"
4. Click any button to test that workflow:
   - **"1. PBP Review"** → See what PBP panel sees
   - **"2. Procurement"** → See what Procurement sees
   - **"3. OPW Panel"** → See what OPW panel sees
   - **"4. AP Control"** → See what AP Control sees
   - **"5. Requester"** → See what the requester sees

**No configuration needed** - they just work! ✨

---

## 📂 Project Structure (What's Where)

```
Barts_Health_SSF-main/
├── src/                          # Frontend code (React app)
│   ├── components/              # Reusable UI pieces
│   ├── pages/                   # Different pages (PBP, Procurement, etc.)
│   ├── hooks/                   # Custom React logic
│   └── stores/                  # Data storage
│
├── supplier-form-api/           # Backend code (Node.js server)
│   ├── src/                     # Server code
│   └── database/                # Database setup files
│
├── docs/                        # Documentation (guides like this!)
│   ├── START_HERE.md           # This file
│   ├── DEVELOPMENT_MODE_GUIDE.md
│   ├── CRN_SETUP_GUIDE.md
│   └── ...
│
└── README.md                    # Project overview
```

**You'll mostly work in:**
- `src/` folder → Frontend (what users see)
- `docs/` folder → Documentation (guides and help)

---

## ❓ Common Questions

### Q: "How do I see my changes?"

**A:** Just save your file! If you're running `npm run dev`, changes appear automatically in your browser.

### Q: "The test buttons aren't showing!"

**A:** Make sure you're running `npm run dev` (NOT `npm run build`). Test buttons only appear in development mode.

### Q: "What's the difference between `npm run dev` and `npm run build`?"

**A:**
- `npm run dev` → **Development mode** (for working on the app)
  - Hot reload (changes appear instantly)
  - Test buttons visible
  - Runs on your computer only

- `npm run build` → **Production mode** (creates the final version)
  - Creates optimized files
  - Test buttons hidden
  - Ready to deploy to hospital servers

**Use `npm run dev` 99% of the time!**

### Q: "How do I test without setting up Companies House API?"

**A:** Use the built-in test company numbers! Just enter:
- `12345678` (Test Company)
- `00445790` (Tesco)
- `04234715` (Sainsbury's)
- `01234567` (Dissolved company for error testing)

No setup needed!

### Q: "What if I see an error?"

**A:**
1. Read the error message (usually tells you what's wrong)
2. Check if you're in the right folder (`cd` to project folder)
3. Try running `npm install` again
4. Restart the dev server (Ctrl+C, then `npm run dev`)
5. If still stuck, copy the error message and ask for help

---

## 🎯 Most Common Tasks

### Starting Work for the Day

```bash
# 1. Open terminal
# 2. Go to project folder
cd "c:\Users\haquefah\Downloads\Barts_Health_SSF-main (1)\Barts_Health_SSF-main"

# 3. Start development server
npm run dev

# 4. Open browser to http://localhost:5173
# 5. Start coding!
```

### Testing a Form Submission

```bash
# 1. Make sure dev server is running (npm run dev)
# 2. Fill out the form in your browser
# 3. In Section 4, use test CRN: 12345678
# 4. Complete to Section 7
# 5. Use test buttons to test different workflows
```

### Checking if Production Build Works

```bash
# 1. Build the production version
npm run build

# 2. Preview it
npm run preview

# 3. Open http://localhost:4173
# 4. Verify test buttons DON'T appear
# 5. Test the form works correctly

# 6. When done, go back to development:
# (Press Ctrl+C to stop preview)
npm run dev
```

---

## 🆘 Getting Help

### Where to Look

1. **This guide** - You're reading it!
2. **[DEVELOPMENT_MODE_GUIDE.md](DEVELOPMENT_MODE_GUIDE.md)** - How development vs production works
3. **[CRN_SETUP_GUIDE.md](CRN_SETUP_GUIDE.md)** - How company verification works

### If You're Stuck

**Before asking for help, try:**
1. Restart the dev server (Ctrl+C, then `npm run dev`)
2. Hard refresh your browser (Ctrl+Shift+R)
3. Check if you saved all your files
4. Read the error message carefully

**Still stuck? Get help by:**
1. Copy the exact error message
2. Note what you were doing when it happened
3. Check if anyone else had the same issue (Google the error)
4. Ask a colleague or IT support

---

## ✅ Checklist for Your First Day

- [ ] I can run `npm run dev` successfully
- [ ] I can see the form in my browser at http://localhost:5173
- [ ] I tested filling out the form
- [ ] I entered test CRN `12345678` and it auto-filled company details
- [ ] I see the test buttons at bottom of Section 7
- [ ] I clicked a test button and saw a review page
- [ ] I know how to stop the server (Ctrl+C)
- [ ] I bookmarked this guide!

**All checked?** You're ready to start working! 🎉

---

## 📖 Next Steps

### Once You're Comfortable

1. **Explore the code** - Look at files in `src/components/`
2. **Make a small change** - Try changing some text
3. **Save and watch it update** - See your change appear!
4. **Use git** - Learn to save and track your changes
5. **Read other guides** - When you need specific features

### Before Deploying to Production

1. **Read** [PRODUCTION_DEPLOYMENT_CHECKLIST.md](../PRODUCTION_DEPLOYMENT_CHECKLIST.md)
2. **Test everything** thoroughly
3. **Get IT support** for server setup
4. **Follow the checklist** step by step

---

## 🎓 Remember

- **You don't need to understand everything** - it's okay to learn as you go!
- **Test buttons are automatic** - they just work in development mode
- **Mistakes are okay** - you can always undo changes
- **Ask questions** - everyone was a beginner once!
- **Save your work** - commit to git regularly

---

## 🌟 You've Got This!

Working on your first project alone can feel overwhelming, but you have:
- ✅ All the guides you need
- ✅ Test features that make testing easy
- ✅ Built-in test data (no setup needed)
- ✅ Automatic behaviors (less to configure)
- ✅ This guide to help you!

**Take it one step at a time, and you'll do great!** 💪

---

**Last Updated:** February 5, 2026
**For:** Beginners working on NHS Supplier Setup Smart Form
**Remember:** `npm run dev` is your friend! 🚀
