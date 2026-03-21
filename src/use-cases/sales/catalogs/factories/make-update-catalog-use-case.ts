import { PrismaCatalogsRepository } from '@/repositories/sales/prisma/prisma-catalogs-repository';
import { UpdateCatalogUseCase } from '../update-catalog';

export function makeUpdateCatalogUseCase() {
  const catalogsRepository = new PrismaCatalogsRepository();
  return new UpdateCatalogUseCase(catalogsRepository);
}
