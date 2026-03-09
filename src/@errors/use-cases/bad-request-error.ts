import type { ErrorCode } from '../error-codes';

export class BadRequestError extends Error {
  public readonly code?: ErrorCode;

  constructor(message: string = 'Bad request error', code?: ErrorCode) {
    super(message);
    this.code = code;
  }
}
