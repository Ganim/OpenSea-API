import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Catalog } from '@/entities/sales/catalog';
import type { CatalogsRepository } from '@/repositories/sales/catalogs-repository';

const VALID_CATALOG_TYPES = [
  'GENERAL',
  'SELLER',
  'CAMPAIGN',
  'CUSTOMER',
  'AI_GENERATED',
];
const VALID_LAYOUTS = ['GRID', 'LIST', 'MAGAZINE'];

interface CreateCatalogUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  type?: string;
  slug?: string;
  layout?: string;
  showPrices?: boolean;
  showStock?: boolean;
  isPublic?: boolean;
  customerId?: string;
  campaignId?: string;
  assignedToUserId?: string;
  priceTableId?: string;
}

interface CreateCatalogUseCaseResponse {
  catalog: Catalog;
}

export class CreateCatalogUseCase {
  constructor(private catalogsRepository: CatalogsRepository) {}

  async execute(
    request: CreateCatalogUseCaseRequest,
  ): Promise<CreateCatalogUseCaseResponse> {
    const { tenantId, name, description, type, slug, layout } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    const finalType = type ?? 'GENERAL';
    if (!VALID_CATALOG_TYPES.includes(finalType)) {
      throw new BadRequestError(
        `Invalid catalog type. Must be one of: ${VALID_CATALOG_TYPES.join(', ')}`,
      );
    }

    const finalLayout = layout ?? 'GRID';
    if (!VALID_LAYOUTS.includes(finalLayout)) {
      throw new BadRequestError(
        `Invalid layout. Must be one of: ${VALID_LAYOUTS.join(', ')}`,
      );
    }

    const finalSlug = slug ?? Catalog.generateSlug(name);

    const existingSlug = await this.catalogsRepository.findBySlug(
      finalSlug,
      tenantId,
    );
    if (existingSlug) {
      throw new BadRequestError('A catalog with this slug already exists');
    }

    const catalog = Catalog.create({
      tenantId: new UniqueEntityID(tenantId),
      name,
      slug: finalSlug,
      description,
      type: finalType,
      layout: finalLayout,
      showPrices: request.showPrices,
      showStock: request.showStock,
      isPublic: request.isPublic,
      customerId: request.customerId
        ? new UniqueEntityID(request.customerId)
        : undefined,
      campaignId: request.campaignId
        ? new UniqueEntityID(request.campaignId)
        : undefined,
      assignedToUserId: request.assignedToUserId
        ? new UniqueEntityID(request.assignedToUserId)
        : undefined,
      priceTableId: request.priceTableId
        ? new UniqueEntityID(request.priceTableId)
        : undefined,
    });

    await this.catalogsRepository.create(catalog);

    return { catalog };
  }
}
