# Firebase Security Rules Fix

## Problem
The Fuller Tracking webapp is experiencing "PERMISSION_DENIED" errors when trying to sync GitHub repositories to Firestore. This is because the Firebase security rules don't allow access to the `repos` collection.

## Solution
Updated Firestore security rules to allow authenticated users to read/write their own data in the following collections:
- `tasks` - Task management
- `repos` - GitHub repository sync data  
- `formResponses` - Form submission data (if needed)

## Security Rules File
Created `firestore.rules` with proper user isolation:
- Users can only access documents where `uid` matches their Firebase user ID
- Prevents unauthorized access to other users' data
- Allows the GitHub sync functionality to work properly

## Deployment Instructions

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `fuller-tracker` project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the content from `firestore.rules` and paste it into the rules editor
5. Click **Publish** to deploy the rules

### Option 2: Firebase CLI
If you have Firebase CLI installed:
```bash
cd "c:\Fuller_Tracking"
firebase deploy --only firestore:rules
```

### Option 3: Manual Rule Creation
Copy this rule content to your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own tasks
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // Allow users to read and write their own repositories
    match /repos/{repoId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // Allow users to read their own form responses (if needed)
    match /formResponses/{responseId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## After Deployment
Once the rules are deployed:
1. The GitHub repository sync should work without permission errors
2. Repository creation will successfully save to Firestore
3. Users will only see their own repositories and tasks
4. The GitHub-as-source-of-truth architecture will function properly

## Testing
- Try creating a new repository through the webapp
- Check that GitHub sync completes without errors
- Verify that repositories appear in the GitHubRepoList component
- Confirm that only your own data is visible (user isolation)
