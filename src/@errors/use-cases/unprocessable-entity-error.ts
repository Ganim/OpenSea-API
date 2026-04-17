import type { ErrorCode } from '../error-codes';

/**
 * 422 Unprocessable Entity — the server understood the request and its syntax,
 * but cannot process it because the provided domain data is semantically
 * invalid (e.g. a domain rule was violated such as "employee requires CPF").
 */
export class UnprocessableEntityError extends Error {
  public readonly code?: ErrorCode;

  constructor(message: string = 'Unprocessable entity', code?: ErrorCode) {
    super(message);
    this.code = code;
  }
}
