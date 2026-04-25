import { PrismaPosTerminalOperatorsRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-operators-repository';

import { RevokeOperatorUseCase } from '../revoke-operator';

export function makeRevokeOperatorUseCase(): RevokeOperatorUseCase {
  return new RevokeOperatorUseCase(new PrismaPosTerminalOperatorsRepository());
}
