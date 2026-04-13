import { PrismaInspectionPlansRepository } from '@/repositories/production/prisma/prisma-inspection-plans-repository';
import { CreateInspectionPlanUseCase } from '../create-inspection-plan';

export function makeCreateInspectionPlanUseCase() {
  const inspectionPlansRepository = new PrismaInspectionPlansRepository();
  return new CreateInspectionPlanUseCase(inspectionPlansRepository);
}
