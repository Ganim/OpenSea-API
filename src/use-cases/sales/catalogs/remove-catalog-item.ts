import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CatalogsRepository } from '@/repositories/sales/catalogs-repository';
import { prisma } from '@/lib/prisma';

interface RemoveCatalogItemUseCaseRequest {
  catalogId: string;
  itemId: string;
  tenantId: string;
}

export class RemoveCatalogItemUseCase {
  constructor(private catalogsRepository: CatalogsRepository) {}

  async execute(request: RemoveCatalogItemUseCaseRequest): Promise<void> {
    const catalog = await this.catalogsRepository.findById(
      new UniqueEntityID(request.catalogId),
      request.tenantId,
    );

    if (!catalog) {
      throw new ResourceNotFoundError('Catalog not found');
    }

    const item = await prisma.catalogItem.findFirst({
      where: {
        id: request.itemId,
        catalogId: request.catalogId,
        tenantId: request.tenantId,
      },
    });

    if (!item) {
      throw new ResourceNotFoundError('Catalog item not found');
    }

    await prisma.catalogItem.delete({
      where: { id: request.itemId },
    });
  }
}
