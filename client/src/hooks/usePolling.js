import { useEffect, useRef } from "react";

function usePolling(callback, delay, enabled = true, immediate = true) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !delay) {
      return undefined;
    }

    if (immediate) {
      callbackRef.current();
    }

    const intervalId = window.setInterval(() => {
      callbackRef.current();
    }, delay);

    return () => window.clearInterval(intervalId);
  }, [delay, enabled, immediate]);
}

export default usePolling;
