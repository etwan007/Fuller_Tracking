# Repository Creation Fix - Testing Guide

## 🎯 Issue Fixed
The webapp was failing to create GitHub repositories under the logged-in user account due to authentication token mismatches and database structure issues.

## ✅ Solution Summary
1. **Fixed GitHub OAuth token flow** - tokens now properly stored in localStorage
2. **Added Firebase user ID tracking** - repositories properly scoped to users
3. **Enhanced error handling** - better user feedback and debugging
4. **Improved authentication fallbacks** - multiple login methods supported

## 🧪 Testing Steps

### Prerequisites
1. GitHub OAuth app configured with:
   - Client ID and Secret in environment variables
   - Redirect URI pointing to your domain/localhost
   - Required scopes: `repo`, `user:email`, `read:user`

2. Firebase project configured with GitHub authentication enabled

### Step 1: Start Development Server
```powershell
cd c:\Fuller_Tracking
npm run dev
```

### Step 2: Test Authentication
1. Open http://localhost:5173 in browser
2. Click hamburger menu (top left)
3. Click GitHub login button
4. Complete OAuth flow or use popup (if not blocked)
5. Verify in browser dev tools → Application → Local Storage:
   - `github_access_token` should be present
   - `google_access_token` may also be present

### Step 3: Test Repository Creation from Tasks
1. Ensure you're logged in (both Google/Firebase and GitHub)
2. Add a new task with name and due date
3. Click on the task to open popup
4. Click "Create Repository" button
5. Enter repository name (alphanumeric, hyphens, underscores only)
6. Should see success message
7. Repository should open in new tab on GitHub

### Step 4: Test Repository Creation from AI Suggestions
1. Enter a project name in the main input
2. Click "Get AI Suggestions"
3. Click on any bullet point suggestion
4. Should create repository and open GitHub page

### Step 5: Verify Database Integration
1. Open Firebase Console → Firestore Database
2. Check `repos` collection - should contain:
   ```json
   {
     "uid": "firebase_user_id",
     "name": "repository_name",
     "owner": "github_username",
     "html_url": "https://github.com/...",
     "githubId": "repo_id_number",
     "full_name": "username/repo_name",
     "private": true,
     "createdAt": "timestamp",
     "source": "created"
   }
   ```

### Step 6: Test Repository Linking
1. Go back to task with created repository
2. Click "Go to Repository" - should open correct GitHub page
3. Test "Relink Repository" if available

## 🔧 Debugging Tools

### Browser Console Tests
Copy and run this in browser console:
```javascript
// Check authentication status
const githubToken = localStorage.getItem('github_access_token');
const googleToken = localStorage.getItem('google_access_token');
console.log('GitHub Token:', githubToken ? 'Present ✅' : 'Missing ❌');
console.log('Google Token:', googleToken ? 'Present ✅' : 'Missing ❌');

// Test GitHub API
if (githubToken) {
  fetch('/api/github-files', {
    headers: { 'Authorization': `Bearer ${githubToken}` }
  }).then(r => r.json()).then(console.log);
}
```

### Network Tab Monitoring
1. Open browser dev tools → Network tab
2. Look for these API calls:
   - `/api/github-login` - should return OAuth URL
   - `/api/github-callback` - should redirect with token
   - `/api/github-create-repo` - should return success
   - `/api/github-files` - should return user repos

## 🚨 Common Issues & Solutions

### Issue: "No GitHub token found"
**Cause**: Authentication failed or token not stored
**Solution**: 
1. Clear localStorage and try login again
2. Check if popup was blocked
3. Use OAuth flow fallback

### Issue: "Repository creation failed - 401"
**Cause**: Invalid or expired token
**Solution**: 
1. Re-authenticate with GitHub
2. Check OAuth scopes include 'repo'
3. Verify environment variables

### Issue: "Repository not found in database"
**Cause**: UID mismatch or query scope issue
**Solution**: 
1. Check Firestore rules allow user access
2. Verify uid field is correctly set
3. Ensure user is logged in to Firebase

### Issue: Repository created but not visible
**Cause**: Firebase query filtering issue
**Solution**: 
1. Check user.uid matches repository uid in database
2. Verify Firebase auth state
3. Check repository collection permissions

## 🔑 Environment Variables Required
```
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret  
GITHUB_REDIRECT_URI=http://localhost:5173/api/github-callback
```

## 📝 File Changes Made
- `api/github-callback.js` - Fixed token passing to frontend
- `api/github-create-repo.js` - Added uid parameter support
- `src/App.jsx` - Enhanced GitHub token handling
- `src/components/TaskPopup.jsx` - Fixed user-scoped queries
- `src/components/GithubLogin.jsx` - Added OAuth fallback
- `src/components/TaskTable.jsx` - Pass user ID to API

## 🎉 Success Indicators
✅ GitHub login works (popup or OAuth redirect)
✅ Repositories created on GitHub under authenticated user
✅ Repositories saved to Firebase with correct user ID
✅ Repository links open correct GitHub pages
✅ User can only see their own repositories
✅ Error messages are clear and actionable

The repository creation issue should now be resolved. Users can successfully create GitHub repositories from tasks and AI suggestions, with proper authentication and database storage.
