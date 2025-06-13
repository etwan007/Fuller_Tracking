import { useState, useCallback } from "react";
import { API_ENDPOINTS, LOCAL_STORAGE_KEYS } from "../constants";
import { sanitizeRepoName, extractProjectName, createRepoDescription } from "../utils/repoHelpers";

/**
 * Custom hook for managing GitHub repository operations
 */
export function useGitHubRepo(user) {
  const syncGitHubRepositories = useCallback(async () => {
    if (!user) return;
    
    try {
      const githubToken = localStorage.getItem(LOCAL_STORAGE_KEYS.GITHUB_ACCESS_TOKEN);
      if (!githubToken) return;

      const response = await fetch(API_ENDPOINTS.GITHUB_SYNC, {
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
        const syncResult = await response.json();
        console.log("GitHub sync completed:", syncResult);
        return syncResult;
      } else {
        console.error("GitHub sync failed:", response.status);
      }
    } catch (error) {
      console.error("Error syncing GitHub repositories:", error);
    }
  }, [user]);

  const handleSelectBullet = useCallback(async (bullet) => {
    const projectName = extractProjectName(bullet);
    const name = sanitizeRepoName(projectName);

    try {
      const githubToken = localStorage.getItem(LOCAL_STORAGE_KEYS.GITHUB_ACCESS_TOKEN);
      const headers = {
        "Content-Type": "application/json"
      };
      
      if (githubToken) {
        headers.Authorization = `Bearer ${githubToken}`;
      }

      const res = await fetch(API_ENDPOINTS.GITHUB_CREATE_REPO, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ 
          name,
          description: createRepoDescription(bullet),
          private: true,
          autoInit: true,
          uid: user?.uid
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        const action = data.action === 'created' ? 'created' : 'linked to existing';
        alert(`GitHub repository "${name}" ${action} successfully!`);
        
        await syncGitHubRepositories();
        
        if (data.repository && data.repository.html_url) {
          window.open(data.repository.html_url, '_blank');
        }
      } else {
        console.error('Repository creation failed:', data);
        const errorMessage = data.error || "Unknown error occurred";
        alert(`Failed to create repository: ${errorMessage}`);
        
        if (data.error && data.error.includes('Unauthorized')) {
          alert('Please re-authenticate with GitHub and try again.');
        }
      }
    } catch (error) {
      console.error("Error creating repository:", error);
      alert("Failed to create repository. Please try again.");
    }
  }, [syncGitHubRepositories, user]);

  return {
    syncGitHubRepositories,
    handleSelectBullet,
  };
}
