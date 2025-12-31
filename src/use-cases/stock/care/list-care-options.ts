/**
 * List Care Options Use Case
 *
 * Returns the catalog of care instruction options grouped by category.
 * This use case does not access the database - it reads from the care manifest.
 */

import type {
  CareOptionDTO,
  CareCatalogProvider,
  CareCategoryType,
} from '@/services/care';

interface ListCareOptionsUseCaseResponse {
  options: Record<CareCategoryType, CareOptionDTO[]>;
}

export class ListCareOptionsUseCase {
  constructor(private careCatalogProvider: CareCatalogProvider) {}

  async execute(): Promise<ListCareOptionsUseCaseResponse> {
    const options = this.careCatalogProvider.listOptionsByCategory();

    return { options };
  }
}
