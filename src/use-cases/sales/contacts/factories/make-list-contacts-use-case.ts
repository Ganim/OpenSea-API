// TODO: Replace with Prisma repository when created
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { ListContactsUseCase } from '@/use-cases/sales/contacts/list-contacts';

export function makeListContactsUseCase() {
  const contactsRepository = new InMemoryContactsRepository();
  return new ListContactsUseCase(contactsRepository);
}
