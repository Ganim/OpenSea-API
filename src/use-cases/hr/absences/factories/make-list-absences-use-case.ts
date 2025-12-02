import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { ListAbsencesUseCase } from '../list-absences';

export function makeListAbsencesUseCase(): ListAbsencesUseCase {
  const absencesRepository = new PrismaAbsencesRepository();

  return new ListAbsencesUseCase(absencesRepository);
}
