
import { useState } from 'react';


export default function TaskTable() {
  const headers = ['Task', 'Priority', 'Due Date'];
  const [TaskResponses, setTaskResponses] = useState([headers]);
  const [TaskName, setTaskName] = useState('');
  const [Priority, setPriority] = useState(1);
  const [DueDate, setDueDate] = useState('');

  // Ensure each row has the same number of cells as headers
  const padRow = (row) =>
    Array.from({ length: headers.length }, (_, i) => row?.[i] ?? '');

  const handleAddTask = () => {
    if (TaskName && DueDate) {
      setTaskResponses([
        ...TaskResponses,
        [TaskName, Priority, DueDate]
      ]);
      setTaskName('');
      setPriority(1);
      setDueDate('');
    }
  };

  const dataRows = TaskResponses.slice(1);

  return (
    <div className="submissions-container">
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
        className="input num-selector"
        style={{ width: '100px' }}e
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
        style={{ width: '135px' }}
        className="input"
        value={DueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      </div>
      <button className="button" onClick={handleAddTask}>Add Task</button>

      <div className="submissions-header task-header">
      {headers.map((header, i) => (
        <div key={i} className="header-item">
        <div className="header-item-bg">{header}</div>
        </div>
      ))}
      </div>
      <div className="submissions-body">
      {dataRows.length > 0 ? (
        dataRows.map((row, i) => (
        <div key={i} className="submission-row-container">
          {padRow(row).map((cell, j) => (
          <div key={j} className="submission-cell">
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