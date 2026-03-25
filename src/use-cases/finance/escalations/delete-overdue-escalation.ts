import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OverdueEscalationsRepository } from '@/repositories/finance/overdue-escalations-repository';

interface DeleteOverdueEscalationUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteOverdueEscalationUseCase {
  constructor(private escalationsRepository: OverdueEscalationsRepository) {}

  async execute(request: DeleteOverdueEscalationUseCaseRequest): Promise<void> {
    const { id, tenantId } = request;

    const existing = await this.escalationsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Escalation template not found');
    }

    await this.escalationsRepository.delete(new UniqueEntityID(id), tenantId);
  }
}
