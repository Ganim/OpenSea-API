import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ContactsRepository } from '@/repositories/sales/contacts-repository';

interface DeleteContactUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteContactUseCase {
  constructor(private contactsRepository: ContactsRepository) {}

  async execute(request: DeleteContactUseCaseRequest): Promise<void> {
    const { id, tenantId } = request;

    const contact = await this.contactsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!contact) {
      throw new ResourceNotFoundError('Contact not found');
    }

    await this.contactsRepository.delete(new UniqueEntityID(id), tenantId);
  }
}
