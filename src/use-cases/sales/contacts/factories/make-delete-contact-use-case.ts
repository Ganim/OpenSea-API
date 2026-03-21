// TODO: Replace with Prisma repository when created
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { DeleteContactUseCase } from '@/use-cases/sales/contacts/delete-contact';

export function makeDeleteContactUseCase() {
  const contactsRepository = new InMemoryContactsRepository();
  return new DeleteContactUseCase(contactsRepository);
}
