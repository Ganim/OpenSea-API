import { PrismaMaterialReturnsRepository } from '@/repositories/production/prisma/prisma-material-returns-repository';
import { ListMaterialReturnsUseCase } from '../list-material-returns';

export function makeListMaterialReturnsUseCase() {
  const materialReturnsRepository = new PrismaMaterialReturnsRepository();
  const listMaterialReturnsUseCase = new ListMaterialReturnsUseCase(
    materialReturnsRepository,
  );
  return listMaterialReturnsUseCase;
}
