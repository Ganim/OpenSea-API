import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CatalogsRepository } from '@/repositories/sales/catalogs-repository';

interface DeleteCatalogUseCaseRequest {
  catalogId: string;
  tenantId: string;
}

export class DeleteCatalogUseCase {
  constructor(private catalogsRepository: CatalogsRepository) {}

  async execute(request: DeleteCatalogUseCaseRequest): Promise<void> {
    const catalog = await this.catalogsRepository.findById(
      new UniqueEntityID(request.catalogId),
      request.tenantId,
    );

    if (!catalog) {
      throw new ResourceNotFoundError('Catalog not found');
    }

    catalog.delete();
    await this.catalogsRepository.save(catalog);
  }
}
