# Build Guide - Preventing Build Failures

## Automatic Safeguards

The build system now includes automatic safeguards to prevent dependency-related build failures:

### 1. **Prebuild Verification** (`prebuild` script)
- Automatically runs before every `npm run build`
- Verifies all required dependencies are present
- Fails fast if dependencies are missing

### 2. **Postinstall Check** (`postinstall` script)
- Runs automatically after `npm install`
- Installs missing critical dependencies if detected
- Ensures dependencies are always available

### 3. **Dependency Verification Script**
- `scripts/ensure-dependencies.sh` - Standalone script to check and install dependencies
- Can be run manually: `bash scripts/ensure-dependencies.sh`

### 4. **Server Build Fix Script**
- `scripts/fix-server-build.sh` - Complete fix for server build issues
- Cleans, reinstalls, and verifies all dependencies
- Run on server: `bash scripts/fix-server-build.sh`

## Required Dependencies

These dependencies are automatically verified:
- `jspdf@^3.0.4`
- `jspdf-autotable@^5.0.2`
- `recharts@^2.15.4`
- `next-themes@^0.4.6`

## Server Deployment

When deploying to server, if build fails:

```bash
cd /var/www/hirebit/frontend  # or your path
bash ../../scripts/fix-server-build.sh
```

Or manually:
```bash
cd frontend
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install
npm run build
```

## How It Works

1. **Before Build**: `prebuild` script checks dependencies
2. **After Install**: `postinstall` script ensures dependencies exist
3. **Manual Check**: Run `npm run verify-deps` anytime
4. **CI/CD**: GitHub Actions workflow checks build on every push

## Troubleshooting

If build still fails:
1. Run `npm run verify-deps` to check dependencies
2. Run `bash scripts/ensure-dependencies.sh` to fix
3. Check `node_modules/next-themes/package.json` exists (common issue)
4. If corrupted, run: `rm -rf node_modules/next-themes && npm install next-themes@^0.4.6 --save --force`

