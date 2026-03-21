import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Catalog } from '@/entities/sales/catalog';
import type { CatalogsRepository } from '@/repositories/sales/catalogs-repository';

interface UpdateCatalogUseCaseRequest {
  catalogId: string;
  tenantId: string;
  name?: string;
  slug?: string;
  description?: string;
  status?: string;
  layout?: string;
  showPrices?: boolean;
  showStock?: boolean;
  isPublic?: boolean;
  coverImageFileId?: string;
}

interface UpdateCatalogUseCaseResponse {
  catalog: Catalog;
}

export class UpdateCatalogUseCase {
  constructor(private catalogsRepository: CatalogsRepository) {}

  async execute(
    request: UpdateCatalogUseCaseRequest,
  ): Promise<UpdateCatalogUseCaseResponse> {
    const catalog = await this.catalogsRepository.findById(
      new UniqueEntityID(request.catalogId),
      request.tenantId,
    );

    if (!catalog) {
      throw new ResourceNotFoundError('Catalog not found');
    }

    if (request.name !== undefined) catalog.name = request.name;
    if (request.slug !== undefined) catalog.slug = request.slug;
    if (request.description !== undefined) catalog.description = request.description;
    if (request.status !== undefined) catalog.status = request.status;
    if (request.layout !== undefined) catalog.layout = request.layout;
    if (request.showPrices !== undefined) catalog.showPrices = request.showPrices;
    if (request.showStock !== undefined) catalog.showStock = request.showStock;
    if (request.isPublic !== undefined) catalog.isPublic = request.isPublic;
    if (request.coverImageFileId !== undefined)
      catalog.coverImageFileId = request.coverImageFileId;

    await this.catalogsRepository.save(catalog);

    return { catalog };
  }
}
