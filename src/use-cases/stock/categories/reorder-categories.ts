import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';
import type { TransactionManager } from '@/lib/transaction-manager';

interface ReorderItem {
  id: string;
  displayOrder: number;
}

interface ReorderCategoriesUseCaseRequest {
  tenantId: string;
  items: ReorderItem[];
}

export class ReorderCategoriesUseCase {
  constructor(
    private categoriesRepository: CategoriesRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute({
    tenantId,
    items,
  }: ReorderCategoriesUseCaseRequest): Promise<void> {
    // Validate all categories exist before updating
    for (const item of items) {
      const category = await this.categoriesRepository.findById(
        new UniqueEntityID(item.id),
        tenantId,
      );

      if (!category) {
        throw new ResourceNotFoundError(
          `Category with id ${item.id} not found.`,
        );
      }
    }

    // Perform all updates atomically
    await this.transactionManager.run(async () => {
      for (const item of items) {
        await this.categoriesRepository.update({
          id: new UniqueEntityID(item.id),
          displayOrder: item.displayOrder,
        });
      }
    });
  }
}
