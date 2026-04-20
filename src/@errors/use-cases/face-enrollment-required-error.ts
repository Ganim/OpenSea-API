/**
 * Raised when a punch flow requires face matching but the employee has no
 * active {@link FaceEnrollment}. Thrown by the FaceMatchValidator
 * (Plan 05-07) to short-circuit the punch pipeline with a friendly message
 * in Portuguese.
 *
 * The HTTP controller for punch-clock (Plan 05-06 / 05-07) maps this to
 * status 412 Precondition Failed — aligning with D-10: PIN fallback still
 * requires a face enrollment; "PIN sozinho" is not accepted.
 */
export class FaceEnrollmentRequiredError extends Error {
  constructor(
    message = 'Cadastre sua biometria com o RH antes de bater ponto.',
  ) {
    super(message);
    this.name = 'FaceEnrollmentRequiredError';
  }
}
