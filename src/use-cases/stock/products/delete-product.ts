import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import { ProductsRepository } from '@/repositories/stock/products-repository';
import { VariantsRepository } from '@/repositories/stock/variants-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface DeleteProductUseCaseRequest {
  tenantId: string;
  id: string;
  userId?: string;
}

export class DeleteProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    private variantsRepository: VariantsRepository,
    private itemsRepository: ItemsRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(request: DeleteProductUseCaseRequest): Promise<void> {
    const { tenantId, id, userId } = request;

    const productId = new UniqueEntityID(id);

    const product = await this.productsRepository.findById(productId, tenantId);

    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }

    // Check if any variant has active items before deleting
    const variants = await this.variantsRepository.findManyByProduct(
      productId,
      tenantId,
    );

    for (const variant of variants) {
      const itemCount = await this.itemsRepository.countByVariantId(
        variant.id,
        tenantId,
      );
      if (itemCount > 0) {
        throw new BadRequestError(
          `Não é possível excluir o produto. A variante "${variant.name}" possui ${itemCount} item(ns) em estoque.`,
        );
      }
    }

    // Soft-delete variants + product atomically
    await this.transactionManager.run(async () => {
      for (const variant of variants) {
        await this.variantsRepository.delete(variant.id);
      }

      await this.productsRepository.delete(productId);
    });

    // Audit log (fire-and-forget)
    queueAuditLog({
      userId,
      action: 'STOCK_PRODUCT_DELETED',
      entity: 'PRODUCT',
      entityId: id,
      module: 'stock',
      description: `Product "${product.name}" deleted`,
      oldData: {
        productId: id,
        name: product.name,
        tenantId,
      },
    }).catch(() => {});
  }
}
