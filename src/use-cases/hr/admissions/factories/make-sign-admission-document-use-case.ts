import { PrismaAdmissionsRepository } from '@/repositories/hr/prisma/prisma-admissions-repository';
import { SignAdmissionDocumentUseCase } from '../sign-admission-document';

export function makeSignAdmissionDocumentUseCase(): SignAdmissionDocumentUseCase {
  const admissionsRepository = new PrismaAdmissionsRepository();
  return new SignAdmissionDocumentUseCase(admissionsRepository);
}
