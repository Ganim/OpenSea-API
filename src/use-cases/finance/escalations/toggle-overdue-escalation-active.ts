import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type OverdueEscalationDTO,
  overdueEscalationToDTO,
} from '@/mappers/finance/overdue-escalation/overdue-escalation-to-dto';
import type { OverdueEscalationsRepository } from '@/repositories/finance/overdue-escalations-repository';

interface ToggleOverdueEscalationActiveUseCaseRequest {
  id: string;
  tenantId: string;
}

interface ToggleOverdueEscalationActiveUseCaseResponse {
  escalation: OverdueEscalationDTO;
}

export class ToggleOverdueEscalationActiveUseCase {
  constructor(private escalationsRepository: OverdueEscalationsRepository) {}

  async execute(
    request: ToggleOverdueEscalationActiveUseCaseRequest,
  ): Promise<ToggleOverdueEscalationActiveUseCaseResponse> {
    const { id, tenantId } = request;

    const existing = await this.escalationsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Escalation template not found');
    }

    const updated = await this.escalationsRepository.update({
      id: new UniqueEntityID(id),
      tenantId,
      isActive: !existing.isActive,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Escalation template not found');
    }

    return { escalation: overdueEscalationToDTO(updated) };
  }
}
