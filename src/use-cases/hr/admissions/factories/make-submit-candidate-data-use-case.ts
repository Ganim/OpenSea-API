import { PrismaAdmissionsRepository } from '@/repositories/hr/prisma/prisma-admissions-repository';
import { SubmitCandidateDataUseCase } from '../submit-candidate-data';

export function makeSubmitCandidateDataUseCase(): SubmitCandidateDataUseCase {
  const admissionsRepository = new PrismaAdmissionsRepository();
  return new SubmitCandidateDataUseCase(admissionsRepository);
}
