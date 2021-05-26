import { useEffect } from 'react';

export interface PingOptions {
  delay?: number;
  maxRetries?: number;
  backoff?: number;
}

const usePing = ({
  delay = 5000,
  maxRetries = 5,
  backoff = 1000,
}: PingOptions = {}): void => {
  useEffect(() => {
    let retries = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const abort = new AbortController();
    const ping = () => {
      fetch('/api/ping', { signal: abort.signal }).then(
        () => {
          retries = 0;
          timeout = setTimeout(() => ping(), delay);
        },
        () => {
          if (retries > maxRetries) {
            console.error('Could not reach server for /ping. Aborting.');
            abort.abort();
            if (timeout != null) clearTimeout(timeout);
            timeout = undefined;
            return;
          }
          retries += 1;
          const newDelay = delay + backoff * 2 ** (retries - 1);
          const secs = newDelay / 1000;
          console.warn(
            `Failed to reach server for /ping. Retry #${retries} in ${secs}s.`
          );
          timeout = setTimeout(() => ping(), newDelay);
        }
      );
    };
    return () => {
      if (timeout) clearInterval(timeout);
      abort.abort();
    };
  }, [delay, maxRetries, backoff]);
};

export default usePing;
