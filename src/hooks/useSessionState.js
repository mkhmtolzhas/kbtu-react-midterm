import { useEffect, useState } from 'react';

function readSessionValue(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// useState that survives the component unmounting (e.g. list -> details -> back)
// for the lifetime of the browser tab.
export function useSessionState(key, initialValue) {
  // Lazy initializer: sessionStorage is read once, on the first render only.
  const [value, setValue] = useState(() => readSessionValue(key, initialValue));

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage is unavailable (private mode): the state still works in memory.
    }
  }, [key, value]);

  return [value, setValue];
}
