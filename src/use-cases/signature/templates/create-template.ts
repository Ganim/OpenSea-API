import type { SignatureTemplate } from '@/entities/signature/signature-template';
import type { SignatureTemplatesRepository } from '@/repositories/signature/signature-templates-repository';

interface CreateSignatureTemplateUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  signatureLevel: string;
  routingType: string;
  signerSlots: unknown;
  expirationDays?: number;
  reminderDays?: number;
}

interface CreateSignatureTemplateUseCaseResponse {
  template: SignatureTemplate;
}

export class CreateSignatureTemplateUseCase {
  constructor(private templatesRepository: SignatureTemplatesRepository) {}

  async execute(
    request: CreateSignatureTemplateUseCaseRequest,
  ): Promise<CreateSignatureTemplateUseCaseResponse> {
    const template = await this.templatesRepository.create({
      tenantId: request.tenantId,
      name: request.name,
      description: request.description,
      signatureLevel: request.signatureLevel,
      routingType: request.routingType,
      signerSlots: request.signerSlots,
      expirationDays: request.expirationDays,
      reminderDays: request.reminderDays,
    });

    return { template };
  }
}
