import { PrismaCatalogsRepository } from '@/repositories/sales/prisma/prisma-catalogs-repository';
import { DeleteCatalogUseCase } from '../delete-catalog';

export function makeDeleteCatalogUseCase() {
  const catalogsRepository = new PrismaCatalogsRepository();
  return new DeleteCatalogUseCase(catalogsRepository);
}
