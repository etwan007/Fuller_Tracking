import React from 'react';


export default function FormSubmissionsTable({ formResponses }) {
  // Determine headers: if formResponses[0] exists, use it, otherwise use defaults.
  const headers = formResponses?.[0] || ['Time Submitted', 'Description', 'Due Date'];

  // Data rows start from the second element (index 1).
  const dataRows = formResponses?.slice(1);

  return (
    <div className="container submissions-container">
      <h2>Form Submissions</h2>

      {/* Header Row (using flexbox) */}
      <div className="submissions-header">
        {headers.map((header, i) => (
          <div key={i} className="header-item">
            {header}
          </div>
        ))}
      </div>

      {/* Data Rows (each one is a distinct container) */}
      <div className="submissions-body">
        {dataRows && dataRows.length > 0 ? (
          dataRows.map((row, i) => (
            // This div is your "rectangle that encompasses the whole row"
            <div key={i} className="submission-row-container">
              {row.map((cell, j) => (
                <div key={j} className="submission-cell">
                  {cell}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="no-submissions-message">
            No submissions yet.
          </div>
        )}
      </div>
    </div>
  );
}