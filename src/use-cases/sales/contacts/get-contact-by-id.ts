import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Contact } from '@/entities/sales/contact';
import type { ContactsRepository } from '@/repositories/sales/contacts-repository';

interface GetContactByIdUseCaseRequest {
  id: string;
  tenantId: string;
}

interface GetContactByIdUseCaseResponse {
  contact: Contact;
}

export class GetContactByIdUseCase {
  constructor(private contactsRepository: ContactsRepository) {}

  async execute(
    request: GetContactByIdUseCaseRequest,
  ): Promise<GetContactByIdUseCaseResponse> {
    const contact = await this.contactsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!contact) {
      throw new ResourceNotFoundError('Contact not found');
    }

    return { contact };
  }
}
