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
    }

    const interval = setInterval(async () => {
      try {
        console.log("Polling GitHub repos...");
        const res = await fetch("https://api.github.com/user/repos", {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          console.error("Unexpected response format:", data);
          return;
        }

        console.log("Fetched repos:", data);

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

        // Add or update repos in Firebase
        for (const repo of data) {
          const repoDocRef = doc(userReposRef, `${user.uid}_${repo.id}`);
          await setDoc(repoDocRef, {
            uid: user.uid,
            name: repo.name,
            html_url: repo.html_url,
            updated_at: repo.updated_at,
          });
          console.log(`Updated repo: ${repo.name}`);
        }
      } catch (err) {
        console.error("Failed to sync repos:", err);
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
            href={user ? `https:ithub.com/${user}` : "https://github.com"}
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            GitHub Repositories
          </a>
        </h2>
       <ul className="repo-list">
        {repos.map((repo, idx) => (
          <li key={repo.id || idx}>
            <a href={repo.html_url} target="_blank" rel="noreferrer" className="button">
              {repo.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
