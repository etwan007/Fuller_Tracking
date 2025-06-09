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
} from "firebase/firestore";

export default function GitHubRepoSync({ accessToken }) {
  const [repos, setRepos] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !accessToken) return;

    async function fetchAndStoreRepos() {
      try {
        const res = await fetch("https://api.github.com/user/repos", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await res.json();
        if (!Array.isArray(data)) return;

        const userReposRef = collection(db, "repos");

        for (const repo of data) {
          const repoDocRef = doc(userReposRef, `${user.uid}_${repo.id}`);
          await setDoc(repoDocRef, {
            uid: user.uid,
            name: repo.name,
            html_url: repo.html_url,
            updated_at: repo.updated_at,
          });
        }
      } catch (err) {
        console.error("Failed to sync repos:", err);
      }
    }

    fetchAndStoreRepos();
  }, [user, accessToken]);

  // Real-time listener
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "repos"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repoList = snapshot.docs.map((doc) => doc.data());
      setRepos(repoList);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="container">
      <h2>Your GitHub Repositories (Live)</h2>
      <ul>
        {repos.map((repo, idx) => (
          <li key={idx}>
            <a href={repo.html_url} target="_blank" rel="noreferrer">
              {repo.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
