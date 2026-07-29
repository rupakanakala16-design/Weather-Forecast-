const ErrorMessage = ({ message }) => (
  <div className="error-card">
    <h3>Something went wrong</h3>
    <p>{message}</p>
  </div>
);

export default ErrorMessage;
