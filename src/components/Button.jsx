import PropTypes from 'prop-types';

export function Button({ children, onClick, className = '', disabled = false, ...props }) {
  return (
    <button
      onClick={onClick}
      className={`button ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};
