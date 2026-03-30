import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { PrismaOccupationalExamRequirementsRepository } from '@/repositories/hr/prisma/prisma-occupational-exam-requirements-repository';
import { CheckEmployeeComplianceUseCase } from '../check-employee-compliance';

export function makeCheckEmployeeComplianceUseCase() {
  const employeesRepository = new PrismaEmployeesRepository();
  const medicalExamsRepository = new PrismaMedicalExamsRepository();
  const examRequirementsRepository =
    new PrismaOccupationalExamRequirementsRepository();
  return new CheckEmployeeComplianceUseCase(
    employeesRepository,
    medicalExamsRepository,
    examRequirementsRepository,
  );
}
