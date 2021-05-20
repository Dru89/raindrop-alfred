export class ExtendedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

const stackFor = (err: unknown) =>
  err instanceof Error
    ? err.stack ?? `${err.name}: ${err.message}`
    : String(err);

export class RethrownError extends ExtendedError {
  public readonly newStack: string | undefined;
  constructor(message: string, public readonly original: unknown) {
    super(message);
    this.newStack = this.stack;

    const stack = stackFor(original);
    const lines = (this.message.match(/\n/g)?.length ?? 0) + 1;
    const base = (this.stack ?? `${this.name}: ${this.message}`)
      .split('\n')
      .slice(0, lines + 1)
      .join('\n');
    this.stack = `${base}\n${stack}`;
  }
}

export class MultiError extends ExtendedError {
  public readonly newStack: string | undefined;
  constructor(message: string, public readonly originalErrors: unknown[]) {
    super(message);
    this.newStack = this.stack;

    const stack = originalErrors
      .map((error, idx) => {
        const newStack = stackFor(error);
        return `Error #${idx + 1}: ${newStack}`;
      })
      .join('\n');
    const lines = (this.message.match(/\n/g)?.length ?? 0) + 1;
    const base = (this.stack ?? `${this.name}: ${this.message}`)
      .split('\n')
      .slice(0, lines + 1)
      .join('\n');
    this.stack = `${base}\n${stack}`;
  }
}
