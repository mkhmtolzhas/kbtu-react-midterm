const MIN_DELAY_MS = 400;
const MAX_DELAY_MS = 900;

export class ApiError extends Error {
  constructor(message, { status = 500, fieldErrors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function isAbortError(error) {
  return error?.name === 'AbortError';
}

function createAbortError() {
  return new DOMException('The request was aborted.', 'AbortError');
}

// `?simulateError=1` fails every request, `?simulateError=0.3` fails ~30 %.
// The parameter is read both before the hash (/?simulateError=1#/) and inside it (#/?simulateError=1).
export function simulatedErrorRate(routeSearch = window.location.hash.split('?')[1] ?? '') {
  const raw = new URLSearchParams(window.location.search).get('simulateError')
    ?? new URLSearchParams(routeSearch).get('simulateError');
  const rate = Number.parseFloat(raw);
  return Number.isNaN(rate) ? 0 : Math.min(Math.max(rate, 0), 1);
}

// Waits a random 400–900 ms like a real network round-trip.
// Rejects with an AbortError as soon as `signal` is aborted.
export function simulateNetwork(signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);

    const handleAbort = () => {
      clearTimeout(timerId);
      reject(createAbortError());
    };

    const timerId = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      if (Math.random() < simulatedErrorRate()) {
        reject(new ApiError('The fleet server is not responding (simulated error).', { status: 500 }));
      } else {
        resolve();
      }
    }, delay);

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}
