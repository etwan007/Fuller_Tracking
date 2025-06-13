// components/GitHubRepoSync.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

export default function GitHubRepoSync({ accessToken: propAccessToken, githubError }) {
  const [repos, setRepos] = useState([]);
  const [user, setUser] = useState(null);
  const [githubUser, setGithubUser] = useState(null); // Store GitHub user info
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  let accessToken = propAccessToken; // Use a local variable to manage accessToken

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      console.log("Auth state changed:", u);
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      console.warn("User is not authenticated");
      return;
    }

    // Fallback to local storage if accessToken is not provided
    if (!accessToken) {
      const tokenFromStorage = localStorage.getItem("github_access_token");
      if (tokenFromStorage) {
        console.log("Using access token from local storage");
        accessToken = tokenFromStorage;
      } else {
        console.error("Access token is undefined and not found in local storage");
        return;
      }
    }    const interval = setInterval(async () => {
      try {
        setIsLoading(true);
        console.log("Polling GitHub repos...");
          // Use the enhanced API endpoint
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Include Authorization header if token exists
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }
        
        const res = await fetch("/api/github-files", {
          headers: headers
        });

        if (!res.ok) {
          if (res.status === 401) {
            console.error("GitHub authentication failed");
            return;
          }
          throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
        }

        const responseData = await res.json();
        
        // Handle enhanced API response format
        const data = responseData.files || [];
        const githubUserData = responseData.user;
        const metadata = responseData.metadata;

        if (!Array.isArray(data)) {
          console.error("Unexpected response format:", responseData);
          return;
        }

        console.log("Fetched repos:", data);
        if (githubUserData) {
          setGithubUser(githubUserData);
          console.log("GitHub user info:", githubUserData);
        }
        if (metadata) {
          setLastSync(new Date(metadata.fetched_at));
        }

        const userReposRef = collection(db, "repos");

        // Get current repos from Firebase
        const snapshot = await getDocs(query(userReposRef, where("uid", "==", user.uid)));
        const firebaseRepos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Create a map of fetched repos
        const fetchedRepoIds = new Set(data.map((repo) => `${user.uid}_${repo.id}`));

        // Delete repos from Firebase that are not in the fetched data
        for (const firebaseRepo of firebaseRepos) {
          if (!fetchedRepoIds.has(firebaseRepo.id)) {
            await deleteDoc(doc(userReposRef, firebaseRepo.id));
            console.log(`Deleted repo from Firebase: ${firebaseRepo.name}`);
          }
        }

        // Add or update repos in Firebase with enhanced data
        for (const repo of data) {
          const repoDocRef = doc(userReposRef, `${user.uid}_${repo.id}`);
          await setDoc(repoDocRef, {
            uid: user.uid,
            name: repo.name,
            full_name: repo.full_name,
            html_url: repo.html_url,
            description: repo.description,
            private: repo.private,
            language: repo.language,
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            updated_at: repo.updated_at,
            created_at: repo.created_at,
            default_branch: repo.default_branch,
            topics: repo.topics || [],
            size: repo.size,
            last_synced: new Date().toISOString()
          });
          console.log(`Updated repo: ${repo.name}`);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to sync repos:", err);
        setIsLoading(false);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [user, accessToken]);

  useEffect(() => {
    if (!user) {
      console.warn("No user for real-time listener"); // Debugging log
      return;
    }

    const q = query(collection(db, "repos"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repoList = snapshot.docs.map((doc) => doc.data());
      
      setRepos(repoList);
    });

    return () => unsubscribe();
  }, [user]);
  return (
    <div className="container">
      <h2>
        <a
          href={githubUser ? githubUser.html_url : "https://github.com"}
          target="_blank"
          rel="noreferrer"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          GitHub Repositories
          {githubUser && ` (${githubUser.login})`}
        </a>
      </h2>
      
      {/* GitHub user info and sync status */}
      {githubUser && (
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
          <div>
            {githubUser.public_repos} public • {githubUser.private_repos || 0} private repos
          </div>
          {lastSync && (
            <div>Last synced: {lastSync.toLocaleTimeString()}</div>
          )}
          {isLoading && <div>🔄 Syncing repositories...</div>}
        </div>
      )}
      
      <ul className="repo-list">
        {repos.map((repo, idx) => (
          <li key={repo.id || idx} style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <a href={repo.html_url} target="_blank" rel="noreferrer" className="button">
                {repo.name}
                {repo.private && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>🔒</span>}
              </a>
              {repo.language && (
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  {repo.language}
                </span>
              )}
              {repo.stargazers_count > 0 && (
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  ⭐ {repo.stargazers_count}
                </span>
              )}
            </div>
            {repo.description && (
              <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>
                {repo.description}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
