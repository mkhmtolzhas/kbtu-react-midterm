import { useEffect, useState } from 'react';

// Returns `value`, but only after it has stopped changing for `delay` ms.
export function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedValue(value), delay);
    // A new keystroke cancels the pending update before it fires.
    return () => clearTimeout(timerId);
  }, [value, delay]);

  return debouncedValue;
}
