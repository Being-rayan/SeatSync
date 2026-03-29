function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          className={`toast toast--${toast.tone}`}
          onClick={() => onDismiss(toast.id)}
          type="button"
        >
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  );
}

export default ToastStack;
