interface ErrorWithCauseOptions {
  cause?: unknown;
}

export default class ErrorWithCause extends Error {
  cause?: unknown;

  constructor(
    message: string | undefined,
    options: ErrorWithCauseOptions = {}
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorWithCause);
    }
    if (message !== undefined) {
      Object.defineProperty(this, 'message', {
        writable: true,
        configurable: true,
        enumerable: false,
        value: message,
      });
    }
    if (options.cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        writable: true,
        configurable: true,
        enumerable: false,
        value: options.cause,
      });
    }
  }
}

export function isErrorWithCause(err: unknown): err is ErrorWithCause {
  if (!(err instanceof Error)) return false;
  const e = err as ErrorWithCause;
  return e.cause !== undefined;
}

Object.defineProperty(ErrorWithCause, 'name', {
  writable: false,
  enumerable: false,
  configurable: true,
  value: 'Error',
});

Object.defineProperties(ErrorWithCause.prototype, {
  cause: {
    writable: true,
    enumerable: false,
    configurable: true,
    value: '',
  },
  name: {
    writable: true,
    enumerable: false,
    configurable: true,
    value: 'Error',
  },
  message: {
    writable: true,
    enumerable: false,
    configurable: true,
    value: '',
  },
});
