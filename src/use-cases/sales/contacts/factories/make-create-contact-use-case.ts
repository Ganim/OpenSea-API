// TODO: Replace with Prisma repositories when PrismaContactsRepository is created (Task 16)
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { CreateContactUseCase } from '@/use-cases/sales/contacts/create-contact';

export function makeCreateContactUseCase() {
  const contactsRepository = new InMemoryContactsRepository();
  const customersRepository = new InMemoryCustomersRepository();

  return new CreateContactUseCase(contactsRepository, customersRepository);
}
