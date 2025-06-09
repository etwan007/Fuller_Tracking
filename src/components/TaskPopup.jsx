// components/TaskPopup.jsx
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function TaskPopup({ task, onClose }) {
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

  return (
    <>
      <div className="blur-overlay" />
      <div className="container popup-overlay" onClick={onClose}>
        <div className="popup-content" onClick={(e) => e.stopPropagation()}>
          <h2>Task Options</h2>
          <div className="popup-items">
            <div className="popup-details">
              <p><strong>Task:</strong> {task.task}</p>
              <p><strong>Priority:</strong> {task.priority}</p>
              <p><strong>Due:</strong> {formatDate(task.dueDate)}</p>
            </div>
            <div className="popup-options">
              <button className="button">Edit</button>
              
              <button className="button" onClick={handleDelete}>Delete</button>
              <button className="button" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
