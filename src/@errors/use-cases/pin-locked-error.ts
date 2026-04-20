/**
 * Thrown by the PIN verification use case when the employee's PIN of ponto is
 * currently locked (D-11 state machine: 5 consecutive failures → 15min
 * lockout). Carries the `lockedUntil` timestamp so the kiosk UI can render a
 * countdown or fall back to another identification method.
 *
 * Also thrown at the transition moment (the failing attempt that triggers the
 * lockout) so the caller always sees `PinLockedError` once the account is
 * locked — never a mix of PinInvalidError + retry-before-lock.
 */
export class PinLockedError extends Error {
  /** Absolute timestamp (server clock) until which the account is locked. */
  public readonly lockedUntil: Date;

  constructor(
    lockedUntil: Date,
    message: string = 'PIN bloqueado. Tente novamente mais tarde.',
  ) {
    super(message);
    this.name = 'PinLockedError';
    this.lockedUntil = lockedUntil;
  }
}
