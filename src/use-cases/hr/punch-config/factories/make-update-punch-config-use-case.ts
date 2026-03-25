import { PrismaPunchConfigRepository } from '@/repositories/hr/prisma/prisma-punch-config-repository';
import { UpdatePunchConfigUseCase } from '../update-punch-config';

export function makeUpdatePunchConfigUseCase(): UpdatePunchConfigUseCase {
  const punchConfigRepository = new PrismaPunchConfigRepository();
  return new UpdatePunchConfigUseCase(punchConfigRepository);
}
