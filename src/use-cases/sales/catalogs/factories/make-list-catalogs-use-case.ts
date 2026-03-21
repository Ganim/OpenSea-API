import { PrismaCatalogsRepository } from '@/repositories/sales/prisma/prisma-catalogs-repository';
import { ListCatalogsUseCase } from '../list-catalogs';

export function makeListCatalogsUseCase() {
  const catalogsRepository = new PrismaCatalogsRepository();
  return new ListCatalogsUseCase(catalogsRepository);
}
