import { useState, useEffect } from 'react';
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, onSnapshot, orderBy } from "firebase/firestore";

export default function TaskTable() {
  const headers = ['Task', 'Priority', 'Due Date'];
  const [TaskName, setTaskName] = useState('');
  const [Priority, setPriority] = useState(1);
  const [DueDate, setDueDate] = useState('');
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [sortType, setSortType] = useState("dueDate"); // <-- make it state

  const padRow = (row) =>
    Array.from({ length: headers.length }, (_, i) => row?.[i] ?? '');

  const handleSortType = () => {
    setSortType((prev) => (prev === "priority" ? "dueDate" : "priority"));
  };

  const handleAddTask = async () => {
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
    let q;
    if (sortType === "dueDate") {
      q = query(
        collection(db, "tasks"),
        where("uid", "==", user.uid),
        orderBy("dueDate", "desc"),
        orderBy("priority")
      );
    } else {
      q = query(
        collection(db, "tasks"),
        where("uid", "==", user.uid),
        orderBy("priority"),
        orderBy("dueDate", "desc")
      );
    }
    const unsub = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user, sortType]); // <-- depend on sortType

  // Debug: log tasks
  console.log("tasks from Firestore:", tasks);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${month}/${day}`;
  };

  const dataRows = tasks.map(t => [
    t.task,
    t.priority,
    formatDate(t.dueDate)
  ]);

  return (
    <div className="container submissions task">
      <h2>Tasks</h2>
      <div className="task-inputs">
        <input
          type="text"
          placeholder="Enter New Task"
          className="input"
          value={TaskName}
          onChange={(e) => setTaskName(e.target.value)}
        />
        <select
          className="button input num-selector"
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
          className="button input date"
          value={DueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div className="task-options">
      <button className="button" onClick={handleAddTask}>Add Task</button>
      <button className='button' onClick={handleSortType}>
        {sortType.toUpperCase()}
      </button>
      </div>
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