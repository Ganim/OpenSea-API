import { ForbiddenError } from './forbidden-error';

export interface PasswordResetRequiredData {
  userId: string;
  reason?: string;
  resetToken: string;
  requestedAt?: Date;
}

export class PasswordResetRequiredError extends ForbiddenError {
  public readonly code = 'PASSWORD_RESET_REQUIRED';

  constructor(public readonly data: PasswordResetRequiredData) {
    super('Password reset is required before you can access the system');
  }
}
