import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  EscalationChannel,
  EscalationTemplateType,
} from '@/entities/finance/overdue-escalation-types';
import {
  type OverdueEscalationDTO,
  overdueEscalationToDTO,
} from '@/mappers/finance/overdue-escalation/overdue-escalation-to-dto';
import type { OverdueEscalationsRepository } from '@/repositories/finance/overdue-escalations-repository';

interface EscalationStepInput {
  daysOverdue: number;
  channel: EscalationChannel;
  templateType: EscalationTemplateType;
  subject?: string;
  message: string;
  isActive?: boolean;
  order: number;
}

interface UpdateOverdueEscalationUseCaseRequest {
  id: string;
  tenantId: string;
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
  steps?: EscalationStepInput[];
}

interface UpdateOverdueEscalationUseCaseResponse {
  escalation: OverdueEscalationDTO;
}

export class UpdateOverdueEscalationUseCase {
  constructor(private escalationsRepository: OverdueEscalationsRepository) {}

  async execute(
    request: UpdateOverdueEscalationUseCaseRequest,
  ): Promise<UpdateOverdueEscalationUseCaseResponse> {
    const { id, tenantId, name, isDefault, steps } = request;

    const existing = await this.escalationsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );
    if (!existing) {
      throw new ResourceNotFoundError('Escalation template not found');
    }

    // If name changed, check uniqueness
    if (name && name.trim() !== existing.name) {
      const duplicateName = await this.escalationsRepository.findByName(
        name.trim(),
        tenantId,
      );
      if (duplicateName && duplicateName.id.toString() !== id) {
        throw new ConflictError(
          'An escalation template with this name already exists',
        );
      }
    }

    // Validate steps if provided
    if (steps) {
      if (steps.length === 0) {
        throw new BadRequestError('At least one escalation step is required');
      }
      for (const step of steps) {
        if (step.daysOverdue < 1) {
          throw new BadRequestError(
            'Days overdue must be at least 1 for each step',
          );
        }
        if (!step.message || step.message.trim().length === 0) {
          throw new BadRequestError('Message is required for each step');
        }
      }
    }

    // If setting as default, clear existing defaults
    if (isDefault) {
      await this.escalationsRepository.clearDefault(tenantId, id);
    }

    const updated = await this.escalationsRepository.update({
      id: new UniqueEntityID(id),
      tenantId,
      name: name?.trim(),
      isDefault,
      isActive: request.isActive,
      steps: steps?.map((step) => ({
        daysOverdue: step.daysOverdue,
        channel: step.channel,
        templateType: step.templateType,
        subject: step.subject,
        message: step.message.trim(),
        isActive: step.isActive ?? true,
        order: step.order,
      })),
    });

    if (!updated) {
      throw new ResourceNotFoundError('Escalation template not found');
    }

    return { escalation: overdueEscalationToDTO(updated) };
  }
}
