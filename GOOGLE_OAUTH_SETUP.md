# 🔐 Google OAuth Setup Guide for AstraNavi

## ✅ What I've Done

1. ✅ Installed NextAuth.js v5 (beta) with MongoDB adapter
2. ✅ Created authentication configuration (`src/lib/auth.ts`)
3. ✅ Added Google OAuth provider
4. ✅ Kept your existing email/password system
5. ✅ Added "Continue with Google" button to login page
6. ✅ Wrapped app with SessionProvider

## 🚀 Next Steps: Get Google OAuth Credentials

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create a New Project (or use existing)
1. Click "Select a project" at the top
2. Click "NEW PROJECT"
3. Name it: "AstraNavi" or "Astrology App"
4. Click "CREATE"

### Step 3: Enable Google+ API
1. Go to: https://console.cloud.google.com/apis/library
2. Search for "Google+ API"
3. Click on it and click "ENABLE"

### Step 4: Create OAuth Credentials
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure OAuth consent screen first:
   - User Type: **External**
   - App name: **AstraNavi**
   - User support email: Your email
   - Developer contact: Your email
   - Click "SAVE AND CONTINUE"
   - Scopes: Skip (click "SAVE AND CONTINUE")
   - Test users: Add your email (for testing)
   - Click "SAVE AND CONTINUE"

4. Back to Create OAuth client ID:
   - Application type: **Web application**
   - Name: **AstraNavi Web Client**
   
5. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   ```

6. Add Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

7. Click "CREATE"

### Step 5: Copy Credentials
You'll see a popup with:
- **Client ID**: Something like `123456789-abc123.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc123xyz`

**Copy both!**

### Step 6: Update .env.local
Open your `.env.local` file and replace:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

With your actual credentials:

```env
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz
```

### Step 7: Generate NextAuth Secret
Run this command in your terminal:

```bash
openssl rand -base64 32
```

Or use this online: https://generate-secret.vercel.app/32

Copy the generated secret and update `.env.local`:

```env
NEXTAUTH_SECRET=your-generated-secret-here
```

### Step 8: Restart Your Dev Server
```bash
npm run dev
```

## 🎉 Test Google Login

1. Go to: http://localhost:3000/login
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected back to your app!

## 📝 For Production (Later)

When you deploy to production (Vercel, etc.):

1. Go back to Google Cloud Console
2. Add your production URLs:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

3. Update `.env.production`:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=your-production-secret
   GOOGLE_CLIENT_ID=same-as-development
   GOOGLE_CLIENT_SECRET=same-as-development
   ```

## 🔒 Security Notes

- ✅ Never commit `.env.local` to Git (already in .gitignore)
- ✅ Use different secrets for development and production
- ✅ Keep your Google Client Secret private
- ✅ Add your production domain before launching

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Console exactly matches:
  `http://localhost:3000/api/auth/callback/google`

### Error: "invalid_client"
- Check that your Client ID and Secret are correct in `.env.local`
- Restart your dev server after changing `.env.local`

### Google login button doesn't work
- Check browser console for errors
- Make sure you've enabled Google+ API
- Verify your credentials are correct

## 📚 What's Next?

After Google OAuth is working:
- ✅ Email/Password login (already working)
- ✅ Google OAuth (just set up)
- 🔜 Phone OTP (later, when you're ready)
- 🔜 Magic Links (optional)

---

**Need help?** Check the NextAuth.js docs: https://authjs.dev/
