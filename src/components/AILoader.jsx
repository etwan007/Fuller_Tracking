export default function AILoader({ loading }) {
  if (!loading) return null;
  return (
    <div className="mb-2 text-blue-600 flex items-center gap-2">
      <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></span>
      Generating AI response...
    </div>
  );
}