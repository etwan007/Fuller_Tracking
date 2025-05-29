export default function FormSubmissionsTable({ formResponses }) {
  // Use fallback headers if none provided
  const headers = formResponses?.[0] || [
    'Time Submitted',
    'Project Name',
    'Description',
    'Due Date'
  ];
  const rows = formResponses?.slice(1) || [];

  return (
    <div className="container">
      <h2>Form Submissions</h2>
      <div className="form-grid">
        {/* Headers */}
        {headers.map((header, i) => (
          <div className="form-grid-header" key={i}>{header}</div>
        ))}
        {/* Rows */}
        {rows.length > 0 ? (
          rows.map((row, i) =>
            row.map((cell, j) => (
              <div className="form-grid-cell" key={`${i}-${j}`}>
                {cell || '\u00A0'}
              </div>
            ))
          )
        ) : (
          <div className="form-grid-empty" style={{ gridColumn: `span ${headers.length}` }}>
            No submissions yet.
          </div>
        )}
      </div>
    </div>
  );
}