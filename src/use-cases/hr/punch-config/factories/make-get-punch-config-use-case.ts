import { PrismaPunchConfigRepository } from '@/repositories/hr/prisma/prisma-punch-config-repository';
import { GetPunchConfigUseCase } from '../get-punch-config';

export function makeGetPunchConfigUseCase(): GetPunchConfigUseCase {
  const punchConfigRepository = new PrismaPunchConfigRepository();
  return new GetPunchConfigUseCase(punchConfigRepository);
}
