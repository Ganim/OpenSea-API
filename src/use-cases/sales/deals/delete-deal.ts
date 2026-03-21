import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DealsRepository } from '@/repositories/sales/deals-repository';

interface DeleteDealUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteDealUseCase {
  constructor(private dealsRepository: DealsRepository) {}

  async execute(request: DeleteDealUseCaseRequest): Promise<void> {
    const { id, tenantId } = request;

    // Verify deal exists before deleting
    const deal = await this.dealsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!deal) {
      throw new ResourceNotFoundError('Deal not found');
    }

    await this.dealsRepository.delete(new UniqueEntityID(id), tenantId);
  }
}
