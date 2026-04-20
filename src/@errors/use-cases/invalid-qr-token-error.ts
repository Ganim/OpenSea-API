/**
 * Thrown when a QR token presented at the kiosk (or any caller looking up
 * an employee by QR) cannot be resolved to an Employee with a matching
 * `qrTokenHash` inside the requested tenant.
 *
 * Consumed by Plan 05-07 `FaceMatchValidator` / `ExecutePunchUseCase` QR
 * branch to fail the batida gracefully when the crachá is not recognised
 * (lost, revoked, rotated, or simply wrong tenant).
 */
export class InvalidQRTokenError extends Error {
  constructor(message: string = 'Crachá não reconhecido') {
    super(message);
    this.name = 'InvalidQRTokenError';
  }
}
