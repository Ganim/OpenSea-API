import { PrismaMaterialReturnsRepository } from '@/repositories/production/prisma/prisma-material-returns-repository';
import { CreateMaterialReturnUseCase } from '../create-material-return';

export function makeCreateMaterialReturnUseCase() {
  const materialReturnsRepository = new PrismaMaterialReturnsRepository();
  const createMaterialReturnUseCase = new CreateMaterialReturnUseCase(
    materialReturnsRepository,
  );
  return createMaterialReturnUseCase;
}
