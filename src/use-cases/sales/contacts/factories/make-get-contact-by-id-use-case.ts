import { PrismaContactsRepository } from '@/repositories/sales/prisma/prisma-contacts-repository';
import { GetContactByIdUseCase } from '@/use-cases/sales/contacts/get-contact-by-id';

export function makeGetContactByIdUseCase() {
  const contactsRepository = new PrismaContactsRepository();
  return new GetContactByIdUseCase(contactsRepository);
}
