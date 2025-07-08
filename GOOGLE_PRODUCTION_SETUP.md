# Google OAuth Production Setup Guide

## Current Status
Your app is in **Developer Mode**, which limits it to 100 users and shows a warning screen.

## Steps to Go Live

### 1. OAuth Consent Screen Verification
**Go to:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent)

**Required Actions:**
- **App Information**: Complete all required fields
- **Authorized Domains**: Add your Replit domain (*.replit.app)
- **Scopes**: Verify Gmail read permissions are listed
- **Test Users**: Remove test user restrictions

### 2. App Verification Process
**Submit for Review:**
- Click "Submit for Verification" in OAuth consent screen
- **Justification**: "Business email management and task tracking platform"
- **Video Demo**: Screen recording showing email categorization
- **Privacy Policy**: Create simple privacy policy (required)

### 3. Required Documents
**Privacy Policy Example:**
```
Baron Email Assistant Privacy Policy

Data Collection: We access Gmail emails to provide categorization services.
Data Usage: Emails are processed by AI for organization only.
Data Storage: No email content stored permanently.
Data Sharing: No data shared with third parties.
User Control: Users can revoke access anytime.

Contact: [your-email]
```

### 4. Domain Configuration
**Current Replit Domain:** `your-repl-name.username.replit.app`
**Add to Google Console:**
- Authorized JavaScript origins
- Authorized redirect URIs

### 5. Production Checklist
- [ ] Complete OAuth consent screen
- [ ] Add privacy policy URL
- [ ] Submit for verification
- [ ] Update authorized domains
- [ ] Test with non-Google accounts
- [ ] Remove "In Development" status

### 6. Timeline
- **Verification Review**: 1-7 business days
- **Expedited Review**: Available for business use cases
- **Temporary Solution**: Keep in testing mode with approved test users

### 7. Alternative: Domain Verification
If you have a custom domain:
1. Purchase domain (Google Domains, Namecheap)
2. Configure DNS for Replit
3. Add verified domain to Google Console
4. Faster approval process

**Contact Google Support if verification takes longer than expected.**