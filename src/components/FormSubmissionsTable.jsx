
export default function FormSubmissionsTable({ formResponses }) {
  const headers = formResponses?.[0] || ['Time Submitted', 'Description', 'Due Date'];
  const dataRows = formResponses?.slice(1) || [];

  // Ensure each row has the same number of cells as headers
  const padRow = (row) =>
    Array.from({ length: headers.length }, (_, i) => row?.[i] ?? '');

  return (
    <div className="container submissions">
      <h2>Form Submissions</h2>
      
      <div className="submissions-body">
        {dataRows.length > 0 ? (
          dataRows.map((row, i) => (
            <div key={i} className="submission-row-container task-container">
              {padRow(row).map((cell, j) => (
                <div key={j} className="submission-cell task-cell">
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