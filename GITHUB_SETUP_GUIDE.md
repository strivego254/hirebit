# Step-by-Step Guide: Push Project to GitHub

## ✅ Prerequisites Completed
- ✅ Git repository initialized
- ✅ `.gitignore` updated (excludes `.next/`, `.env.local`, `node_modules`, etc.)
- ✅ Build files removed from tracking

## 📋 Step-by-Step Instructions

### Step 1: Stage All Source Files
```bash
cd "/home/fidel-ochieng-ogola/HR RECRU EXAMPLE PROJECT"
git add .
```

### Step 2: Commit Your Changes
```bash
git commit -m "Update Reports & Analytics to display applicant data from Supabase"
```

**Alternative commit message:**
```bash
git commit -m "Initial commit: HR Recruitment System with n8n integration"
```

### Step 3: Choose Your Repository Option

#### Option A: Use Existing Repository
Your current remote is: `https://github.com/data-world-254/N8N-WORKFLOW.git`

If you want to push to this existing repo:
```bash
git push origin main
```

#### Option B: Create a New Repository (Recommended)

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `hr-recruitment-system` (or your preferred name)
   - Description: "HR Recruitment System with n8n workflow integration"
   - Choose **Public** or **Private**
   - ⚠️ **DO NOT** check "Initialize with README", "Add .gitignore", or "Choose a license"
   - Click **"Create repository"**

2. **Remove the old remote and add the new one:**
   ```bash
   # Remove old remote
   git remote remove origin
   
   # Add your new repository (replace YOUR_USERNAME and REPO_NAME)
   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
   
   # Example:
   # git remote add origin https://github.com/data-world-254/hr-recruitment-system.git
   ```

3. **Push to the new repository:**
   ```bash
   git push -u origin main
   ```

### Step 4: Verify the Push
- Go to your GitHub repository page
- You should see all your source files
- ✅ Verify that `.env.local` and `.next/` are NOT visible (they should be ignored)

## 🔒 Security Reminders

Before pushing, ensure these sensitive files are NOT in the repository:
- ✅ `.env.local` - Should be ignored
- ✅ `.env` - Should be ignored
- ✅ Any files containing API keys or secrets

Your `.gitignore` file should already handle this, but double-check:
```bash
git status | grep -E "\.env"
```

If you see `.env` files, they won't be committed (they're ignored).

## 📝 Next Steps After Pushing

1. **Create a README.md** (if not already present):
   - Add project description
   - Setup instructions
   - Environment variables needed

2. **Add environment variables template:**
   - Your `env.example` file should be in the repo
   - Document required variables in README

3. **Set up GitHub Secrets** (for CI/CD if needed):
   - Go to repository Settings → Secrets
   - Add your Supabase credentials (if using GitHub Actions)

## 🛠️ Useful Git Commands

```bash
# Check status
git status

# See what's staged
git status --short

# View commit history
git log --oneline

# Check remote
git remote -v

# Pull latest changes (if working with others)
git pull origin main

# Create a new branch
git checkout -b feature-name
```

## ❓ Troubleshooting

### If you get "repository not found" error:
- Check that the repository URL is correct
- Verify you have access to the repository
- Make sure you're authenticated: `git config --global user.name` and `git config --global user.email`

### If you get "authentication failed":
- You may need to use a Personal Access Token instead of password
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### If you want to start fresh:
```bash
# Remove all files from tracking (but keep them locally)
git rm -r --cached .

# Re-add everything according to .gitignore
git add .

# Commit
git commit -m "Clean up repository"
```

