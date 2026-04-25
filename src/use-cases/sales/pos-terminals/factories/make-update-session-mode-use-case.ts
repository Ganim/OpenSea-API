import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';

import { UpdateSessionModeUseCase } from '../update-session-mode';

export function makeUpdateSessionModeUseCase(): UpdateSessionModeUseCase {
  return new UpdateSessionModeUseCase(new PrismaPosTerminalsRepository());
}
