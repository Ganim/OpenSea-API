import { PrismaCatalogsRepository } from '@/repositories/sales/prisma/prisma-catalogs-repository';
import { GetCatalogByIdUseCase } from '../get-catalog-by-id';

export function makeGetCatalogByIdUseCase() {
  const catalogsRepository = new PrismaCatalogsRepository();
  return new GetCatalogByIdUseCase(catalogsRepository);
}
