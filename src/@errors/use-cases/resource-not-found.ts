import type { ErrorCode } from '../error-codes';

export class ResourceNotFoundError extends Error {
  public readonly code?: ErrorCode;

  constructor(message: string = 'Resource not found', code?: ErrorCode) {
    super(message);
    this.code = code;
  }
}
