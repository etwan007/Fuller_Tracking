import "/src/app.css";

export default function FormSubmissionsTable({ formResponses }) {
  return (
    <section className="container">
      <h2>Form Submissions</h2>
      <table className="form-table">
        <thead>
          <tr>
            {(formResponses?.[0] || ['Time Submitted', 'Project Name', 'Description', 'Due Date']).map((header, i) => (
              <th key={i}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {formResponses?.slice(1).length > 0 ? (
            formResponses.slice(1).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="form-table-placeholder">No submissions yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}