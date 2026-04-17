import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureTemplate } from '@/entities/signature/signature-template';
import type { SignatureTemplatesRepository } from '@/repositories/signature/signature-templates-repository';

const VALID_SIGNATURE_LEVELS = ['SIMPLE', 'ADVANCED', 'QUALIFIED'] as const;
const VALID_ROUTING_TYPES = ['SEQUENTIAL', 'PARALLEL', 'HYBRID'] as const;

interface UpdateSignatureTemplateUseCaseRequest {
  tenantId: string;
  templateId: string;
  name?: string;
  description?: string | null;
  signatureLevel?: string;
  routingType?: string;
  signerSlots?: unknown;
  expirationDays?: number | null;
  reminderDays?: number;
  isActive?: boolean;
}

interface UpdateSignatureTemplateUseCaseResponse {
  template: SignatureTemplate;
}

export class UpdateSignatureTemplateUseCase {
  constructor(private templatesRepository: SignatureTemplatesRepository) {}

  async execute(
    request: UpdateSignatureTemplateUseCaseRequest,
  ): Promise<UpdateSignatureTemplateUseCaseResponse> {
    const existingTemplate = await this.templatesRepository.findById(
      new UniqueEntityID(request.templateId),
      request.tenantId,
    );

    if (!existingTemplate) {
      throw new ResourceNotFoundError('Signature template not found');
    }

    if (
      request.signatureLevel !== undefined &&
      !VALID_SIGNATURE_LEVELS.includes(
        request.signatureLevel as (typeof VALID_SIGNATURE_LEVELS)[number],
      )
    ) {
      throw new BadRequestError(
        `Invalid signatureLevel. Expected one of: ${VALID_SIGNATURE_LEVELS.join(', ')}`,
      );
    }

    if (
      request.routingType !== undefined &&
      !VALID_ROUTING_TYPES.includes(
        request.routingType as (typeof VALID_ROUTING_TYPES)[number],
      )
    ) {
      throw new BadRequestError(
        `Invalid routingType. Expected one of: ${VALID_ROUTING_TYPES.join(', ')}`,
      );
    }

    const updatedTemplate = await this.templatesRepository.update({
      id: request.templateId,
      name: request.name,
      description: request.description,
      signatureLevel: request.signatureLevel,
      routingType: request.routingType,
      signerSlots: request.signerSlots,
      expirationDays: request.expirationDays,
      reminderDays: request.reminderDays,
      isActive: request.isActive,
    });

    if (!updatedTemplate) {
      throw new ResourceNotFoundError('Signature template not found');
    }

    return { template: updatedTemplate };
  }
}
