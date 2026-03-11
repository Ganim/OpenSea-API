import type { ErrorCode } from '../error-codes';

export class CannotDeletePaidEntryError extends Error {
  public readonly code?: ErrorCode;

  constructor(status: string, code?: ErrorCode) {
    super(`Cannot delete an entry with status ${status}`);
    this.code = code;
  }
}
