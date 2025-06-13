import PropTypes from 'prop-types';

export function Card({ children, className = '' }) {
  return (
    <div className={`border rounded shadow p-4 bg-white ${className}`}>
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export function CardContent({ children }) {
  return <div className="text-gray-800">{children}</div>;
}

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
};
