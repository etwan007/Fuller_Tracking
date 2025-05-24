export default function FormSubmissionsTable({ formResponses }) {
  return (
    <section className="mt-4">
      <h2 className="text-lg font-bold mb-2">Form Submissions</h2>
      <table className="w-full border text-sm">
        <thead>
          <tr>
            {(formResponses?.[0] || ['Time Submitted', 'Project Name', 'Description', 'Due Date']).map((header, i) => (
              <th key={i} className="border p-1">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {formResponses?.slice(1).length > 0 ? (
            formResponses.slice(1).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="border p-1">{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="text-center p-2">No submissions yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}