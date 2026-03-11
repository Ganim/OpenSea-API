import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TransactionManager } from '@/lib/transaction-manager';
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
    private transactionManager: TransactionManager,
  ) {}

  async execute(request: DeleteProductUseCaseRequest): Promise<void> {
    const { tenantId, id, userId } = request;

    const productId = new UniqueEntityID(id);

    const product = await this.productsRepository.findById(productId, tenantId);

    if (!product) {
      throw new ResourceNotFoundError('Product not found');
    }

    // Soft-delete variants + product atomically
    await this.transactionManager.run(async () => {
      const variants = await this.variantsRepository.findManyByProduct(
        productId,
        tenantId,
      );

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
