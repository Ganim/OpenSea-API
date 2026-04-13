import { PrismaInspectionPlansRepository } from '@/repositories/production/prisma/prisma-inspection-plans-repository';
import { UpdateInspectionPlanUseCase } from '../update-inspection-plan';

export function makeUpdateInspectionPlanUseCase() {
  const inspectionPlansRepository = new PrismaInspectionPlansRepository();
  return new UpdateInspectionPlanUseCase(inspectionPlansRepository);
}
