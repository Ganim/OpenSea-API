import { PrismaCatalogsRepository } from '@/repositories/sales/prisma/prisma-catalogs-repository';
import { AddCatalogItemUseCase } from '../add-catalog-item';

export function makeAddCatalogItemUseCase() {
  const catalogsRepository = new PrismaCatalogsRepository();
  return new AddCatalogItemUseCase(catalogsRepository);
}
