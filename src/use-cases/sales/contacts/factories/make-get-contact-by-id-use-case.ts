// TODO: Replace with Prisma repository when created
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { GetContactByIdUseCase } from '@/use-cases/sales/contacts/get-contact-by-id';

export function makeGetContactByIdUseCase() {
  const contactsRepository = new InMemoryContactsRepository();
  return new GetContactByIdUseCase(contactsRepository);
}
