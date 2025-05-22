import React, { useState, useEffect } from 'react';

export default function FormSubmissions() {
  const [formResponses, setFormResponses] = useState([]);

  const fetchFormResponses = async () => {
    try {
      const res = await fetch('/api/google-form-responses');
      const data = await res.json();
      console.log('Fetched form data:', data); // ✅ Log output
      setFormResponses(data.values || []);
    } catch (err) {
      console.error('Failed to fetch form responses:', err);
    }
  };

  useEffect(() => {
    fetchFormResponses();
    const interval = setInterval(fetchFormResponses, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (action, rowIndex) => {
    const row = formResponses[rowIndex + 1]; // +1 for header
    console.log(`${action} request for:`, row);
  };

  const headers =
    formResponses.length > 0 && formResponses[0].length > 0
      ? formResponses[0]
      : ['Time Submitted', 'Project Name', 'Description', 'Due Date'];

  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold mb-4">Form Submissions</h2>
      <table className="w-full border text-sm">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="border p-2 text-left">{header}</th>
            ))}
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {formResponses.length > 1 ? (
            formResponses.slice(1).map((row, i) => (
              <tr key={i}>
                {headers.map((_, j) => (
                  <td key={j} className="border p-2">{row[j] || ''}</td>
                ))}
                <td className="border p-2 space-x-2">
                  <button className="text-blue-600" onClick={() => handleAction('edit', i)}>Edit</button>
                  <button className="text-green-600" onClick={() => handleAction('confirm', i)}>Confirm</button>
                  <button className="text-red-600" onClick={() => handleAction('deny', i)}>Deny</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length + 1} className="text-center p-4">
                No submissions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
