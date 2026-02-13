import { ForbiddenError } from './forbidden-error';

export interface PinSetupRequiredData {
  userId: string;
  pinType: 'access' | 'action' | 'both';
}

export class PinSetupRequiredError extends ForbiddenError {
  public readonly code = 'PIN_SETUP_REQUIRED';

  constructor(public readonly data: PinSetupRequiredData) {
    super('PIN setup is required before you can access the system');
  }
}
