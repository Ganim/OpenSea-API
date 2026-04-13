import { PrismaInspectionPlansRepository } from '@/repositories/production/prisma/prisma-inspection-plans-repository';
import { ListInspectionPlansUseCase } from '../list-inspection-plans';

export function makeListInspectionPlansUseCase() {
  const inspectionPlansRepository = new PrismaInspectionPlansRepository();
  return new ListInspectionPlansUseCase(inspectionPlansRepository);
}
