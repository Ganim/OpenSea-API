import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Catalog } from '@/entities/sales/catalog';
import type { CatalogsRepository } from '@/repositories/sales/catalogs-repository';

interface GetCatalogByIdUseCaseRequest {
  catalogId: string;
  tenantId: string;
}

interface GetCatalogByIdUseCaseResponse {
  catalog: Catalog;
}

export class GetCatalogByIdUseCase {
  constructor(private catalogsRepository: CatalogsRepository) {}

  async execute(
    request: GetCatalogByIdUseCaseRequest,
  ): Promise<GetCatalogByIdUseCaseResponse> {
    const catalog = await this.catalogsRepository.findById(
      new UniqueEntityID(request.catalogId),
      request.tenantId,
    );

    if (!catalog) {
      throw new ResourceNotFoundError('Catalog not found');
    }

    return { catalog };
  }
}
