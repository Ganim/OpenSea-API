// TODO: Replace with Prisma repository when created
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { UpdateContactUseCase } from '@/use-cases/sales/contacts/update-contact';

export function makeUpdateContactUseCase() {
  const contactsRepository = new InMemoryContactsRepository();
  return new UpdateContactUseCase(contactsRepository);
}
