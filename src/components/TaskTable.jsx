import { useState, useEffect } from 'react';
import { auth, provider, signInWithPopup, signOut, db } from "../firebase";
import { collection, addDoc, getDocs, query, where, onSnapshot } from "firebase/firestore";

export default function TaskTable() {
  const headers = ['Task', 'Priority', 'Due Date'];
  const [TaskResponses, setTaskResponses] = useState([headers]);
  const [TaskName, setTaskName] = useState('');
  const [Priority, setPriority] = useState(1);
  const [DueDate, setDueDate] = useState('');
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

  // Ensure each row has the same number of cells as headers
  const padRow = (row) =>
    Array.from({ length: headers.length }, (_, i) => row?.[i] ?? '');

  // Store task, priority, and due date in Firestore
  const handleAddTask = async () => {
    console.log("handleAddTask called", { user, TaskName, DueDate });
    if (!user) {
      alert("You must be signed in to add a task.");
      return;
    }
    if (!TaskName || !DueDate) {
      alert("Please enter a task name and due date.");
      return;
    }
    try {
      await addDoc(collection(db, "tasks"), {
        uid: user.uid,
        task: TaskName,
        priority: Priority,
        dueDate: DueDate,
        created: Date.now(),
      });
      setTaskName('');
      setPriority(1);
      setDueDate('');
    } catch (err) {
      alert("Failed to add task: " + err.message);
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    
    if (!user) {
      setTasks([]);
      return;
    }
    // Real-time updates
    const q = query(collection(db, "tasks"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);



// Prepare rows for display
  const dataRows = tasks.map(t => [t.task, t.priority, t.dueDate]);

  return (
    <div className="submissions-container task">
      <h2>Tasks</h2>
      {!user && (
        <button onClick={() => signInWithPopup(auth, provider)}>
          Sign in with Google
        </button>
      )}
      <div className="task-inputs">
        <input
          type="text"
          placeholder="Enter New Task"
          className="input"
          value={TaskName}
          onChange={(e) => setTaskName(e.target.value)}
        />

        <select
          className="input num-selector"
          style={{ width: '100px' }}
          value={Priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="input date"
          value={DueDate}
          onChange={(e) => setDueDate(e.target.value)}
          
          // Hide the text, show only the calendar icon
        />
      </div>
      <button className="button" onClick={handleAddTask}>Add Task</button>

      <div className="submissions-body">
        {dataRows.length > 0 ? (
          dataRows.map((row, i) => (
            <div key={i} className="submission-row-container task-container">
              {padRow(row).map((cell, j) => (
                <div key={j} className="task-cell">
                  {cell}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="no-submissions-message">
            No Tasks
          </div>
        )}
      </div>
    </div>
  );
}