export function Button({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`button ${className}`}
    >
      {children}
    </button>
  );
}
