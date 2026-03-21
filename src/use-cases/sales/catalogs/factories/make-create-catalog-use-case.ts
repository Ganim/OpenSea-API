import { PrismaCatalogsRepository } from '@/repositories/sales/prisma/prisma-catalogs-repository';
import { CreateCatalogUseCase } from '../create-catalog';

export function makeCreateCatalogUseCase() {
  const catalogsRepository = new PrismaCatalogsRepository();
  return new CreateCatalogUseCase(catalogsRepository);
}
