// components/TaskPopup.jsx
import { doc, deleteDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

export default function TaskPopup({ task, onClose }) {
  const [activeStatus, setActiveStatus] = useState(
    task?.active ? "Active" : "Inactive"
  ); // Add null check for task
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${month}/${day}`;
  };

  if (!task) return null;

  const handleDelete = async () => {
    await deleteDoc(doc(db, "tasks", task.id));
    onClose();
  };

  const handleActivate = async () => {
    const taskRef = doc(db, "tasks", task.id);
    const newActiveState = !task.active;

    await updateDoc(taskRef, { active: newActiveState });

    // Update the task object locally to reflect the new state
    task.active = newActiveState;
    setActiveStatus(newActiveState ? "Active" : "Inactive");
  };

  const handleComplete = async () => {
    const taskRef = doc(db, "tasks", task.id);
    const completedTaskRef = doc(db, "CompletedTasks", task.id);

    const taskData = { ...task, completedAt: new Date().toISOString() };

    await setDoc(completedTaskRef, taskData);
    await deleteDoc(taskRef);
    onClose();
  };  const handleRepoAction = async () => {
    if (!task.repoName) {
      const repoName = prompt("Enter a name for the new repository:");
      if (repoName) {
        // Use the proper GitHub API to create the repository
        const githubToken = localStorage.getItem("github_access_token");
        
        if (!githubToken) {
          alert("Please authenticate with GitHub first.");
          return;
        }
          try {
          const response = await fetch("/api/github-create-repo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${githubToken}`
            },
            body: JSON.stringify({
              name: repoName,
              description: `Repository for task: ${task.task}`,
              private: true,
              autoInit: true,
              taskId: task.id,
              uid: user?.uid // Pass Firebase user ID
            }),
          });
          
          const data = await response.json();
          if (data.success) {
            alert(`Repository '${repoName}' ${data.action === 'created' ? 'created' : 'linked'} successfully!`);
            
            // Update the task with the repo name
            const taskRef = doc(db, "tasks", task.id);
            await updateDoc(taskRef, { repoName });
            
            // Open the repository if we have the URL
            if (data.repository && data.repository.html_url) {
              window.open(data.repository.html_url, "_blank");
            }
          } else {
            alert(`Failed to create repository: ${data.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Repository creation error:', error);
          alert('Failed to create repository. Please try again.');
        }
      }    } else {
      if (!user) {
        alert("Please log in to access your repositories.");
        return;
      }
      
      // Query repos for the current user only
      const repoQuery = query(collection(db, "repos"), where("uid", "==", user.uid));
      const repoCollection = await getDocs(repoQuery);
      const repoDoc = repoCollection.docs.find(
        (doc) => doc.data().name === task.repoName
      );if (repoDoc) {
        const repoData = repoDoc.data();
        console.log('Repository data found:', repoData); // Debug log
        
        // Use the stored URLs or construct from available data
        let repoUrl;
        
        // Try different URL field names for backwards compatibility
        if (repoData.html_url) {
          repoUrl = repoData.html_url;
        } else if (repoData.htmlUrl) {
          repoUrl = repoData.htmlUrl;
        } else if (repoData.full_name) {
          repoUrl = `https://github.com/${repoData.full_name}`;
        } else if (repoData.fullName) {
          repoUrl = `https://github.com/${repoData.fullName}`;
        } else if (repoData.owner && repoData.name) {
          repoUrl = `https://github.com/${repoData.owner}/${repoData.name}`;
        } else if (repoData.owner) {
          repoUrl = `https://github.com/${repoData.owner}/${task.repoName}`;        } else {
          // Repository exists but lacks URL data - try to recreate/link it properly
          console.log('Repository URL data missing, available fields:', Object.keys(repoData));
          
          const githubToken = localStorage.getItem("github_access_token");
          if (!githubToken) {
            alert("GitHub authentication required to access repository. Please log in to GitHub and try again.");
            return;
          }
          
          // Try to recreate the repository connection with proper GitHub API
          try {
            console.log('Attempting to link repository with GitHub API...');            const response = await fetch("/api/github-create-repo", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${githubToken}`
              },
              body: JSON.stringify({
                name: repoData.name,
                description: `Repository for task: ${task.task}`,
                private: true,
                autoInit: false, // Don't auto-init since repo might already exist
                uid: user?.uid // Pass Firebase user ID
              }),
            });
            
            const result = await response.json();
            if (result.success && result.repository && result.repository.html_url) {
              console.log('Successfully linked repository:', result.repository.html_url);
              window.open(result.repository.html_url, "_blank");
              return;
            } else {
              console.error('Failed to link repository:', result);
            }
          } catch (error) {
            console.error('Error linking repository:', error);
          }
          
          // Last resort: try to fetch user info and construct URL
          try {
            const response = await fetch('/api/github-files', {
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.user && data.user.login) {
                repoUrl = `https://github.com/${data.user.login}/${repoData.name}`;
                console.log('Constructed repository URL from user info:', repoUrl);
              }
            }
          } catch (error) {
            console.error('Failed to get GitHub user info:', error);
          }
          
          if (!repoUrl) {
            alert(`Repository "${repoData.name}" found in database but lacks URL information.\n\nThis might be an older repository entry. Please try:\n1. Make sure you're logged into GitHub\n2. Click "Create Repository" to properly link it\n3. Or visit your GitHub profile manually to find the repository`);
            return;
          }
        }
        
        console.log('Opening repository URL:', repoUrl);
        window.open(repoUrl, "_blank");
      } else {
        alert("Repository not found in database.");
      }    }
  };

  const handleRelinkRepository = async () => {
    if (!task.repoName) {
      alert("No repository name associated with this task.");
      return;
    }

    const githubToken = localStorage.getItem("github_access_token");
    if (!githubToken) {
      alert("Please authenticate with GitHub first.");
      return;
    }

    try {      const response = await fetch("/api/github-create-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${githubToken}`
        },
        body: JSON.stringify({
          name: task.repoName,
          description: `Repository for task: ${task.task}`,
          private: true,
          autoInit: false, // Don't auto-init since repo might already exist
          uid: user?.uid // Pass Firebase user ID
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Repository '${task.repoName}' ${data.action === 'created' ? 'created' : 'relinked'} successfully!`);
        
        // Open the repository if we have the URL
        if (data.repository && data.repository.html_url) {
          window.open(data.repository.html_url, "_blank");
        }
      } else {
        alert(`Failed to relink repository: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Repository relink error:', error);
      alert('Failed to relink repository. Please try again.');
    }
  };

  return (
    <>
      <div className="blur-overlay" />
      <div
        className={`container popup-overlay${task.active ? " active-task" : ""}`}
        onClick={onClose}
      >
        <div className="popup-content" onClick={(e) => e.stopPropagation()}>
          <h2>Task Options</h2>
          <div className="popup-items">
            <div className="popup-details">
              <p>
                <strong>Task:</strong> {task.task}
              </p>
              <p>
                <strong>Priority:</strong> {task.priority}
              </p>
              <p>
                <strong>Due:</strong> {formatDate(task.dueDate)}
              </p>
            </div>
            <div className="popup-options">
              <button
                className={`button ${
                  activeStatus === "Active" ? "taskActive" : ""
                }`}
                onClick={handleActivate}
              >
                {activeStatus}
              </button>
              <button className="button" onClick={handleComplete}>
                Complete
              </button>
              <button className="button">Edit</button>
              <button className="button" onClick={handleDelete}>
                Delete
              </button>
              <button className="button" onClick={onClose}>
                Close
              </button>              <button className="button" onClick={handleRepoAction}>
                {task.repoName ? "Go to Repository" : "Create Repository"}
              </button>
              {task.repoName && (
                <button className="button" onClick={handleRelinkRepository} style={{fontSize: '0.9rem'}}>
                  Relink Repository
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
