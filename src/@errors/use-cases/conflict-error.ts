import type { ErrorCode } from '../error-codes';

export class ConflictError extends Error {
  public readonly code?: ErrorCode;

  constructor(
    message: string = 'Resource was modified by another request',
    code?: ErrorCode,
  ) {
    super(message);
    this.code = code;
  }
}
