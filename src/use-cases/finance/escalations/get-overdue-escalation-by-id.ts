import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type OverdueEscalationDTO,
  overdueEscalationToDTO,
} from '@/mappers/finance/overdue-escalation/overdue-escalation-to-dto';
import type { OverdueEscalationsRepository } from '@/repositories/finance/overdue-escalations-repository';

interface GetOverdueEscalationByIdUseCaseRequest {
  id: string;
  tenantId: string;
}

interface GetOverdueEscalationByIdUseCaseResponse {
  escalation: OverdueEscalationDTO;
}

export class GetOverdueEscalationByIdUseCase {
  constructor(private escalationsRepository: OverdueEscalationsRepository) {}

  async execute(
    request: GetOverdueEscalationByIdUseCaseRequest,
  ): Promise<GetOverdueEscalationByIdUseCaseResponse> {
    const { id, tenantId } = request;

    const escalation = await this.escalationsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!escalation) {
      throw new ResourceNotFoundError('Escalation template not found');
    }

    return { escalation: overdueEscalationToDTO(escalation) };
  }
}
