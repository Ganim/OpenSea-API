import { PrismaInspectionPlansRepository } from '@/repositories/production/prisma/prisma-inspection-plans-repository';
import { DeleteInspectionPlanUseCase } from '../delete-inspection-plan';

export function makeDeleteInspectionPlanUseCase() {
  const inspectionPlansRepository = new PrismaInspectionPlansRepository();
  return new DeleteInspectionPlanUseCase(inspectionPlansRepository);
}
