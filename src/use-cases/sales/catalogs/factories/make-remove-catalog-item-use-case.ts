import { PrismaCatalogsRepository } from '@/repositories/sales/prisma/prisma-catalogs-repository';
import { RemoveCatalogItemUseCase } from '../remove-catalog-item';

export function makeRemoveCatalogItemUseCase() {
  const catalogsRepository = new PrismaCatalogsRepository();
  return new RemoveCatalogItemUseCase(catalogsRepository);
}
