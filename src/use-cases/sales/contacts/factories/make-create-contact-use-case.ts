import { PrismaContactsRepository } from '@/repositories/sales/prisma/prisma-contacts-repository';
import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { CreateContactUseCase } from '@/use-cases/sales/contacts/create-contact';

export function makeCreateContactUseCase() {
  const contactsRepository = new PrismaContactsRepository();
  const customersRepository = new PrismaCustomersRepository();

  return new CreateContactUseCase(contactsRepository, customersRepository);
}
