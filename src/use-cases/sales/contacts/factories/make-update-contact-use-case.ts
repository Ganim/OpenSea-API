// TODO: Replace with Prisma repository when PrismaContactsRepository is created (Task 16)
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { UpdateContactUseCase } from '@/use-cases/sales/contacts/update-contact';

export function makeUpdateContactUseCase() {
  const contactsRepository = new InMemoryContactsRepository();

  return new UpdateContactUseCase(contactsRepository);
}
