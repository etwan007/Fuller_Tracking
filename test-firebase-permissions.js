// Test script to verify Firebase permissions fix
// Run this in the browser console after deploying the new Firestore rules

console.log("🔧 Testing Firebase Permissions Fix...");

// Test 1: Check if user is authenticated
const testAuthentication = () => {
  const user = firebase.auth().currentUser;
  if (user) {
    console.log("✅ User authenticated:", user.uid);
    return true;
  } else {
    console.log("❌ User not authenticated");
    return false;
  }
};

// Test 2: Try to write to repos collection
const testRepoWrite = async () => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log("❌ Cannot test repo write - user not authenticated");
      return false;
    }

    const testRepoDoc = {
      uid: user.uid,
      name: "test-repo-permissions",
      githubId: 999999999,
      owner: "test-user",
      full_name: "test-user/test-repo-permissions",
      html_url: "https://github.com/test-user/test-repo-permissions",
      description: "Test repository for permissions",
      private: true,
      syncedAt: new Date().toISOString(),
      source: "permission-test"
    };

    const docRef = firebase.firestore().collection('repos').doc(`${user.uid}_999999999`);
    await docRef.set(testRepoDoc);
    console.log("✅ Successfully wrote to repos collection");
    
    // Clean up test document
    await docRef.delete();
    console.log("✅ Test document cleaned up");
    return true;
  } catch (error) {
    console.log("❌ Failed to write to repos collection:", error.message);
    return false;
  }
};

// Test 3: Try to read from repos collection
const testRepoRead = async () => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log("❌ Cannot test repo read - user not authenticated");
      return false;
    }

    const reposRef = firebase.firestore().collection('repos').where('uid', '==', user.uid);
    const snapshot = await reposRef.get();
    console.log(`✅ Successfully read ${snapshot.size} repositories from repos collection`);
    return true;
  } catch (error) {
    console.log("❌ Failed to read from repos collection:", error.message);
    return false;
  }
};

// Test 4: Test GitHub sync API call
const testGitHubSync = async () => {
  try {
    const githubToken = localStorage.getItem("github_access_token");
    const user = firebase.auth().currentUser;
    
    if (!githubToken) {
      console.log("⚠️ No GitHub token found - skipping sync test");
      return false;
    }

    if (!user) {
      console.log("❌ Cannot test GitHub sync - user not authenticated");
      return false;
    }

    const response = await fetch("/api/github-sync", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${githubToken}`
      },
      body: JSON.stringify({
        uid: user.uid
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ GitHub sync successful:", result);
      return true;
    } else {
      console.log("❌ GitHub sync failed:", response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log("❌ GitHub sync error:", error.message);
    return false;
  }
};

// Run all tests
const runAllTests = async () => {
  console.log("\n🚀 Starting Firebase Permissions Tests...\n");
  
  const authTest = testAuthentication();
  if (!authTest) {
    console.log("\n❌ Tests failed - user must be authenticated first");
    return;
  }

  const writeTest = await testRepoWrite();
  const readTest = await testRepoRead();
  const syncTest = await testGitHubSync();

  console.log("\n📊 Test Results:");
  console.log("Authentication:", authTest ? "✅ PASS" : "❌ FAIL");
  console.log("Repo Write:", writeTest ? "✅ PASS" : "❌ FAIL");
  console.log("Repo Read:", readTest ? "✅ PASS" : "❌ FAIL");
  console.log("GitHub Sync:", syncTest ? "✅ PASS" : "⚠️ SKIP/FAIL");

  if (writeTest && readTest) {
    console.log("\n🎉 Firebase permissions are working correctly!");
    console.log("The GitHub repository sync should now work without errors.");
  } else {
    console.log("\n⚠️ Some tests failed. Check Firebase security rules deployment.");
  }
};

// Export the test function
window.testFirebasePermissions = runAllTests;

console.log("📝 Test functions loaded. Run 'testFirebasePermissions()' to start tests.");
