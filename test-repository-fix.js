// Test script to verify GitHub repository creation fix
// This can be run in the browser console to test the API directly

async function testRepositoryCreation() {
  console.log('Testing GitHub repository creation...');
  
  // Check if user is authenticated
  const githubToken = localStorage.getItem('github_access_token');
  if (!githubToken) {
    console.error('❌ No GitHub token found. Please login to GitHub first.');
    return;
  }
  
  console.log('✅ GitHub token found');
  
  // Test repository creation API
  try {
    const response = await fetch('/api/github-create-repo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${githubToken}`
      },
      body: JSON.stringify({
        name: 'test-repo-' + Date.now(),
        description: 'Test repository created by repository fix',
        private: true,
        autoInit: true,
        uid: 'test-user-id'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Repository creation successful:', data);
      console.log('Repository URL:', data.repository?.html_url);
    } else {
      console.error('❌ Repository creation failed:', data);
    }
  } catch (error) {
    console.error('❌ API request failed:', error);
  }
}

// Test GitHub files API
async function testGitHubFiles() {
  console.log('Testing GitHub files API...');
  
  const githubToken = localStorage.getItem('github_access_token');
  if (!githubToken) {
    console.error('❌ No GitHub token found');
    return;
  }
  
  try {
    const response = await fetch('/api/github-files', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ GitHub files API successful');
      console.log('User:', data.user?.login);
      console.log('Repositories found:', data.files?.length || 0);
    } else {
      console.error('❌ GitHub files API failed:', data);
    }
  } catch (error) {
    console.error('❌ GitHub files API request failed:', error);
  }
}

// Check authentication status
function checkAuthStatus() {
  console.log('=== Authentication Status ===');
  
  const githubToken = localStorage.getItem('github_access_token');
  const googleToken = localStorage.getItem('google_access_token');
  
  console.log('GitHub Token:', githubToken ? '✅ Present' : '❌ Missing');
  console.log('Google Token:', googleToken ? '✅ Present' : '❌ Missing');
  
  // Check Firebase auth state
  if (typeof firebase !== 'undefined' && firebase.auth) {
    const user = firebase.auth().currentUser;
    console.log('Firebase User:', user ? `✅ ${user.email}` : '❌ Not authenticated');
  }
}

// Run tests
console.log('Repository Creation Test Suite');
console.log('============================');
checkAuthStatus();

// To run tests, call these functions in the browser console:
// testGitHubFiles()
// testRepositoryCreation()

console.log('Ready to test! Use the following commands:');
console.log('- checkAuthStatus() - Check authentication status');
console.log('- testGitHubFiles() - Test GitHub API connection');
console.log('- testRepositoryCreation() - Test repository creation');
