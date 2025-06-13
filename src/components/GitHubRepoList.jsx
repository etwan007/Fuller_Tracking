// GitHub Repository List Component
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { API_ENDPOINTS, LOCAL_STORAGE_KEYS, POLLING_INTERVALS } from "../constants";

export default function GitHubRepoList() {  const [repos, setRepos] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    }    const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.GITHUB_ACCESS_TOKEN);
    if (!accessToken) {
      console.error("No GitHub access token found");
      return;
    }

    // Sync repositories from GitHub to Firebase database
    const syncRepositories = async () => {
      try {
        setIsLoading(true);
        console.log("Syncing repositories from GitHub...");

        const response = await fetch(API_ENDPOINTS.GITHUB_SYNC, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            uid: user.uid
          })
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error("GitHub authentication failed during sync");
            return;
          }
          throw new Error(`GitHub sync failed: ${response.status} ${response.statusText}`);
        }
        
        const syncResult = await response.json();
        console.log("GitHub sync completed:", syncResult);
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to sync repositories:", err);
        setIsLoading(false);
      }
    };    // Initial sync
    syncRepositories();

    // Set up periodic sync
    const interval = setInterval(syncRepositories, POLLING_INTERVALS.GITHUB_SYNC);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) {
      console.warn("No user for real-time listener"); // Debugging log
      return;
    }

    const q = query(collection(db, "repos"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repoList = snapshot.docs.map((doc) => doc.data());
      
      setRepos(repoList);
    });    return () => unsubscribe();
  }, [user]);
  
  return (
    <div className="container">
      <h2>GitHub Repositories</h2>
      
      {isLoading && <div>🔄 Syncing repositories...</div>}
      
      <ul className="repo-list">
        {repos.map((repo, idx) => (
          <li key={repo.id || idx} style={{ marginBottom: '0.5rem' }}>
            <a href={repo.html_url} target="_blank" rel="noreferrer" className="button">
              {repo.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
