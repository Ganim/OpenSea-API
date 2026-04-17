import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureTemplatesRepository } from '@/repositories/signature/signature-templates-repository';

interface DeleteSignatureTemplateUseCaseRequest {
  tenantId: string;
  templateId: string;
}

export class DeleteSignatureTemplateUseCase {
  constructor(private templatesRepository: SignatureTemplatesRepository) {}

  async execute(request: DeleteSignatureTemplateUseCaseRequest): Promise<void> {
    const existingTemplate = await this.templatesRepository.findById(
      new UniqueEntityID(request.templateId),
      request.tenantId,
    );

    if (!existingTemplate) {
      throw new ResourceNotFoundError('Signature template not found');
    }

    await this.templatesRepository.delete(
      new UniqueEntityID(request.templateId),
    );
  }
}
