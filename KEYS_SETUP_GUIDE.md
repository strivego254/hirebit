# Keys & Secrets Setup Guide

## 🔐 CRON_SECRET

**Generated locally** - Used to secure cron endpoints.

### Generate Methods:

**1. Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**2. OpenSSL:**
```bash
openssl rand -hex 32
```

**3. Python:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**4. Online (if needed):**
- https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")

### Usage:
- Add to `backend/.env`: `CRON_SECRET=your_generated_secret`
- Used in: `/api/system/reports/auto-generate` endpoint
- Send via: Header `x-cron-secret` or query param `?secret=...`

---

## ☁️ S3 Bucket Keys (AWS)

**Created in AWS IAM** - NOT generated locally.

### Steps to Create:

1. **Go to AWS Console**
   - Navigate to: https://console.aws.amazon.com/iam/
   - Or: AWS Console → IAM → Users

2. **Create/Select User**
   - Create new user (recommended: `hirebit-s3-user`)
   - Or select existing user

3. **Create Access Key**
   - Go to user → "Security credentials" tab
   - Click "Create access key"
   - Choose use case: **"Application running outside AWS"**
   - Click "Next" → "Create access key"

4. **Save Keys**
   - **Access Key ID** → `S3_ACCESS_KEY` in `backend/.env`
   - **Secret Access Key** → `S3_SECRET_KEY` in `backend/.env`
   - ⚠️ **Secret key is shown ONLY ONCE** - save immediately!

5. **Attach S3 Policy**
   - Go to user → "Permissions" tab
   - Click "Add permissions" → "Attach policies directly"
   - Search for: `AmazonS3FullAccess` (or create custom policy below)

### IAM Policy Example (Custom - Least Privilege):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

Replace `your-bucket-name` with your actual S3 bucket name.

### Environment Variables:

```bash
# backend/.env
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_REGION=us-east-1
S3_BUCKET_URL=https://your-bucket.s3.amazonaws.com
```

---

## 🌐 Alternative Cloud Providers

### DigitalOcean Spaces:

1. Go to: DigitalOcean → API → Spaces Keys
2. Create new key pair
3. Use:
   - `S3_ACCESS_KEY` = Spaces Access Key
   - `S3_SECRET_KEY` = Spaces Secret Key
   - `S3_BUCKET_URL` = `https://your-space.region.digitaloceanspaces.com`
   - `S3_REGION` = Your space region (e.g., `nyc3`)

### Wasabi:

1. Go to: Wasabi Console → Access Keys
2. Create new access key
3. Use:
   - `S3_ACCESS_KEY` = Access Key ID
   - `S3_SECRET_KEY` = Secret Access Key
   - `S3_BUCKET_URL` = `https://s3.wasabisys.com/your-bucket`
   - `S3_REGION` = Your Wasabi region

### Backblaze B2:

1. Go to: Backblaze → App Keys
2. Create new application key
3. Note: B2 uses different API - may need adapter or different SDK

---

## 🔒 Security Best Practices

### For CRON_SECRET:
- ✅ Generate strong random secret (32+ bytes)
- ✅ Store in `backend/.env` (never commit)
- ✅ Rotate periodically (every 6-12 months)
- ✅ Use different secrets for dev/staging/production

### For S3 Keys:
- ✅ Use IAM user (not root account)
- ✅ Apply least privilege principle
- ✅ Rotate keys every 90 days
- ✅ Store in `backend/.env` (never commit)
- ✅ Use AWS Secrets Manager for production (optional)
- ✅ Enable MFA for IAM user (if possible)

### General:
- ✅ Never commit `.env` files to git
- ✅ Use environment-specific secrets
- ✅ Monitor for unauthorized access
- ✅ Use secret management tools in production (AWS Secrets Manager, HashiCorp Vault, etc.)

---

## 📝 Quick Reference

### Generate CRON_SECRET:
```bash
# Quick one-liner
CRON_SECRET=$(openssl rand -hex 32)
echo "CRON_SECRET=$CRON_SECRET" >> backend/.env
```

### Test S3 Connection:
```bash
# After setting S3 keys in backend/.env
cd backend
node -e "
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  }
});
client.send(new ListBucketsCommand({})).then(r => console.log('✅ S3 Connected:', r.Buckets)).catch(e => console.error('❌ Error:', e.message));
"
```

---

## 🆘 Troubleshooting

### CRON_SECRET not working:
- Check `backend/.env` has `CRON_SECRET` set
- Verify secret matches in request header/query
- Check backend logs for authentication errors

### S3 connection failing:
- Verify `S3_ACCESS_KEY` and `S3_SECRET_KEY` are correct
- Check IAM user has S3 permissions
- Verify bucket name in `S3_BUCKET` exists
- Check region matches bucket region
- Ensure bucket policy allows access from your IP (if restricted)

