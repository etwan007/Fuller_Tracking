// Diagnostic script to identify Firebase authentication context issues
// Run this in the browser console to debug permission problems

console.log("🔍 Firebase Authentication Diagnostic");

// Check Firebase Auth state
const checkFirebaseAuth = () => {
  try {
    if (typeof firebase === 'undefined') {
      console.log("❌ Firebase not loaded");
      return false;
    }

    const user = firebase.auth().currentUser;
    if (user) {
      console.log("✅ User authenticated:");
      console.log("  - UID:", user.uid);
      console.log("  - Email:", user.email);
      console.log("  - Display Name:", user.displayName);
      return user;
    } else {
      console.log("❌ No authenticated user");
      return false;
    }
  } catch (error) {
    console.log("❌ Error checking auth:", error);
    return false;
  }
};

// Test Firestore permissions directly
const testFirestorePermissions = async () => {
  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log("❌ Cannot test Firestore - no authenticated user");
      return;
    }

    console.log("🧪 Testing Firestore permissions...");

    // Test simple write to repos collection
    const testDoc = {
      uid: user.uid,
      name: "permission-test",
      githubId: 999999,
      test: true,
      timestamp: new Date().toISOString()
    };

    const docRef = firebase.firestore().collection('repos').doc(`${user.uid}_test`);
    
    console.log("📝 Attempting to write test document...");
    await docRef.set(testDoc);
    console.log("✅ Write successful!");

    console.log("📖 Attempting to read test document...");
    const doc = await docRef.get();
    if (doc.exists) {
      console.log("✅ Read successful!", doc.data());
    } else {
      console.log("❌ Document doesn't exist after write");
    }

    console.log("🗑️ Cleaning up test document...");
    await docRef.delete();
    console.log("✅ Cleanup successful!");

  } catch (error) {
    console.log("❌ Firestore permission test failed:");
    console.log("  - Error:", error.message);
    console.log("  - Code:", error.code);
    console.log("  - Full error:", error);
  }
};

// Check GitHub token and make API test
const testGitHubIntegration = async () => {
  try {
    const githubToken = localStorage.getItem("github_access_token");
    console.log("🔑 GitHub token:", githubToken ? "Found" : "Not found");

    if (!githubToken) {
      console.log("❌ No GitHub token - cannot test integration");
      return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
      console.log("❌ No Firebase user - cannot test integration");
      return;
    }

    console.log("🧪 Testing GitHub sync API...");
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

    console.log("📡 GitHub sync response:", response.status, response.statusText);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ GitHub sync successful:", result);
    } else {
      const error = await response.text();
      console.log("❌ GitHub sync failed:", error);
    }

  } catch (error) {
    console.log("❌ GitHub integration test failed:", error);
  }
};

// Run all diagnostics
const runDiagnostics = async () => {
  console.log("\n🚀 Starting Firebase Diagnostics...\n");

  const user = checkFirebaseAuth();
  
  if (user) {
    await testFirestorePermissions();
    await testGitHubIntegration();
  }

  console.log("\n✅ Diagnostics complete!");
};

// Export to global scope
window.runFirebaseDiagnostics = runDiagnostics;
window.checkFirebaseAuth = checkFirebaseAuth;
window.testFirestorePermissions = testFirestorePermissions;
window.testGitHubIntegration = testGitHubIntegration;

console.log("📋 Diagnostic functions loaded:");
console.log("  - runFirebaseDiagnostics() - Run all tests");
console.log("  - checkFirebaseAuth() - Check auth state");
console.log("  - testFirestorePermissions() - Test Firestore access");
console.log("  - testGitHubIntegration() - Test GitHub sync");
