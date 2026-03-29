import { createContext, useContext, useMemo, useState } from "react";
import ToastStack from "../components/ToastStack";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (toast) => {
    const id = Date.now() + Math.random();
    const nextToast = { id, tone: "info", ...toast };

    setToasts((current) => [nextToast, ...current].slice(0, 4));

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3800);
  };

  const removeToast = (id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const value = useMemo(
    () => ({
      showToast
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
