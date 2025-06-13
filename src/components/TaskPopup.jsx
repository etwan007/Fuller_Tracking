// components/TaskPopup.jsx
import { doc, deleteDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";

export default function TaskPopup({ task, onClose }) {
  const [activeStatus, setActiveStatus] = useState(
    task?.active ? "Active" : "Inactive"
  ); // Add null check for task

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
  };

  const handleRepoAction = async () => {
    if (!task.repoName) {
      const repoName = prompt("Enter a name for the new repository:");
      if (repoName) {
        await addDoc(collection(db, "repos"), { name: repoName });
        const taskRef = doc(db, "tasks", task.id);
        await updateDoc(taskRef, { repoName });
        alert(`Repository '${repoName}' created successfully!`);
      }
    } else {
      const repoCollection = await getDocs(collection(db, "repos"));
      const repoExists = repoCollection.docs.some(
        (doc) => doc.data().name === task.repoName
      );

      if (repoExists) {
        window.open(`https://github.com/${task.repoName}`, "_blank");
      } else {
        alert("Repository not found.");
      }
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
              </button>
              <button className="button" onClick={handleRepoAction}>
                {task.repoName ? "Go to Repository" : "Create Repository"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
