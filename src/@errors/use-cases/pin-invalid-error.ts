/**
 * Thrown by the PIN verification use case when the provided PIN does not
 * match the employee's stored hash but the account is NOT locked (yet).
 *
 * Used by Plan 05-07 `ExecutePunchUseCase` kiosk PIN+matricula branch to
 * surface a friendly HTTP 400 to the kiosk UI with the remaining attempt
 * count so the funcionário knows how close they are to the lockout.
 */
export class PinInvalidError extends Error {
  /**
   * How many more attempts remain before the PIN gets locked for 15min.
   * `null` when the PIN was never configured (there is nothing to attempt
   * against, so the "remaining" concept does not apply).
   */
  public readonly attemptsRemaining: number | null;

  constructor(
    message: string = 'PIN incorreto',
    attemptsRemaining: number | null = null,
  ) {
    super(message);
    this.name = 'PinInvalidError';
    this.attemptsRemaining = attemptsRemaining;
  }
}
