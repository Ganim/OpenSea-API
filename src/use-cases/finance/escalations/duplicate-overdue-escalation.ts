import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type OverdueEscalationDTO,
  overdueEscalationToDTO,
} from '@/mappers/finance/overdue-escalation/overdue-escalation-to-dto';
import type { OverdueEscalationsRepository } from '@/repositories/finance/overdue-escalations-repository';

interface DuplicateOverdueEscalationUseCaseRequest {
  id: string;
  tenantId: string;
}

interface DuplicateOverdueEscalationUseCaseResponse {
  escalation: OverdueEscalationDTO;
}

export class DuplicateOverdueEscalationUseCase {
  constructor(private escalationsRepository: OverdueEscalationsRepository) {}

  async execute(
    request: DuplicateOverdueEscalationUseCaseRequest,
  ): Promise<DuplicateOverdueEscalationUseCaseResponse> {
    const { id, tenantId } = request;

    const source = await this.escalationsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!source) {
      throw new ResourceNotFoundError('Escalation template not found');
    }

    const newName = await this.generateUniqueName(source.name, tenantId);

    const duplicated = await this.escalationsRepository.create({
      tenantId,
      name: newName,
      isDefault: false,
      isActive: source.isActive,
      steps: source.steps.map((step) => ({
        daysOverdue: step.daysOverdue,
        channel: step.channel,
        templateType: step.templateType,
        subject: step.subject,
        message: step.message,
        isActive: step.isActive,
        order: step.order,
      })),
    });

    return { escalation: overdueEscalationToDTO(duplicated) };
  }

  private async generateUniqueName(
    baseName: string,
    tenantId: string,
  ): Promise<string> {
    const primary = `${baseName} (cópia)`;
    if (!(await this.escalationsRepository.findByName(primary, tenantId))) {
      return primary;
    }
    for (let i = 2; i <= 50; i++) {
      const candidate = `${baseName} (cópia ${i})`;
      if (!(await this.escalationsRepository.findByName(candidate, tenantId))) {
        return candidate;
      }
    }
    return `${baseName} (cópia ${Date.now()})`;
  }
}
