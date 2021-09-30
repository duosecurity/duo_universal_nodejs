export class DuoException extends Error {
  inner?: Error;

  constructor(message: string, error?: Error | null) {
    super(message);

    this.name = 'DuoException';
    Error.captureStackTrace(this, this.constructor);

    if (error) this.inner = error;
  }
}
