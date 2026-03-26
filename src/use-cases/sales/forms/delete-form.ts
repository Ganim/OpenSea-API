import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FormsRepository } from '@/repositories/sales/forms-repository';

interface DeleteFormUseCaseRequest {
  tenantId: string;
  formId: string;
}

export class DeleteFormUseCase {
  constructor(private formsRepository: FormsRepository) {}

  async execute(input: DeleteFormUseCaseRequest): Promise<void> {
    const form = await this.formsRepository.findById(
      new UniqueEntityID(input.formId),
      input.tenantId,
    );

    if (!form) {
      throw new ResourceNotFoundError('Form not found.');
    }

    await this.formsRepository.delete(form.id, input.tenantId);
  }
}
