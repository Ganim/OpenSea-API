import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
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

interface CreateOverdueEscalationUseCaseRequest {
  tenantId: string;
  name: string;
  isDefault?: boolean;
  isActive?: boolean;
  steps: EscalationStepInput[];
}

interface CreateOverdueEscalationUseCaseResponse {
  escalation: OverdueEscalationDTO;
}

export class CreateOverdueEscalationUseCase {
  constructor(private escalationsRepository: OverdueEscalationsRepository) {}

  async execute(
    request: CreateOverdueEscalationUseCaseRequest,
  ): Promise<CreateOverdueEscalationUseCaseResponse> {
    const { tenantId, name, isDefault, steps } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Escalation name is required');
    }

    if (!steps || steps.length === 0) {
      throw new BadRequestError('At least one escalation step is required');
    }

    // Validate step daysOverdue are positive
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

    // Check for duplicate name within tenant
    const existingByName = await this.escalationsRepository.findByName(
      name.trim(),
      tenantId,
    );
    if (existingByName) {
      throw new ConflictError(
        'An escalation template with this name already exists',
      );
    }

    // If this escalation is set as default, clear existing defaults
    if (isDefault) {
      await this.escalationsRepository.clearDefault(tenantId);
    }

    const escalation = await this.escalationsRepository.create({
      tenantId,
      name: name.trim(),
      isDefault: isDefault ?? false,
      isActive: request.isActive ?? true,
      steps: steps.map((step) => ({
        daysOverdue: step.daysOverdue,
        channel: step.channel,
        templateType: step.templateType,
        subject: step.subject,
        message: step.message.trim(),
        isActive: step.isActive ?? true,
        order: step.order,
      })),
    });

    return { escalation: overdueEscalationToDTO(escalation) };
  }
}
