import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CatalogsRepository } from '@/repositories/sales/catalogs-repository';
import { prisma } from '@/lib/prisma';

interface AddCatalogItemUseCaseRequest {
  catalogId: string;
  tenantId: string;
  variantId: string;
  position?: number;
  featured?: boolean;
  customNote?: string;
}

interface AddCatalogItemUseCaseResponse {
  itemId: string;
}

export class AddCatalogItemUseCase {
  constructor(private catalogsRepository: CatalogsRepository) {}

  async execute(
    request: AddCatalogItemUseCaseRequest,
  ): Promise<AddCatalogItemUseCaseResponse> {
    const catalog = await this.catalogsRepository.findById(
      new UniqueEntityID(request.catalogId),
      request.tenantId,
    );

    if (!catalog) {
      throw new ResourceNotFoundError('Catalog not found');
    }

    // Check for duplicate
    const existing = await prisma.catalogItem.findUnique({
      where: {
        catalogId_variantId: {
          catalogId: request.catalogId,
          variantId: request.variantId,
        },
      },
    });

    if (existing) {
      throw new BadRequestError('This variant is already in the catalog');
    }

    const item = await prisma.catalogItem.create({
      data: {
        tenantId: request.tenantId,
        catalogId: request.catalogId,
        variantId: request.variantId,
        position: request.position ?? 0,
        featured: request.featured ?? false,
        customNote: request.customNote,
      },
    });

    return { itemId: item.id };
  }
}
