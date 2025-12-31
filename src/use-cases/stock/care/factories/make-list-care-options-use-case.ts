import { getCareCatalogProvider } from '@/services/care';
import { ListCareOptionsUseCase } from '../list-care-options';

export function makeListCareOptionsUseCase() {
  const careCatalogProvider = getCareCatalogProvider();
  return new ListCareOptionsUseCase(careCatalogProvider);
}
