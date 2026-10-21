import { useEffect, useState } from 'react';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSessionValue(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    const stored = JSON.parse(raw);
    // Fields added to the defaults after the value was saved still get their default.
    return isPlainObject(fallback) && isPlainObject(stored) ? { ...fallback, ...stored } : stored;
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
