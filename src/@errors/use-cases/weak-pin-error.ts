/**
 * Thrown by the set-punch-pin use case when the proposed PIN matches one of
 * the 11 explicitly-blocked weak sequences (10 repeating digits + `123456`)
 * per Claude's Discretion C-11. Maps to HTTP 400 at the controller boundary.
 *
 * Downstream contract: the set-pin endpoint must reject with this error BEFORE
 * hashing the PIN so the blocked value never lands in bcrypt's log anywhere.
 */
export class WeakPinError extends Error {
  constructor(
    message: string = 'PIN não pode ser uma sequência óbvia (ex: 123456, 111111).',
  ) {
    super(message);
    this.name = 'WeakPinError';
  }
}
