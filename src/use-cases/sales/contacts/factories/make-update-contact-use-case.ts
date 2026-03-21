import { PrismaContactsRepository } from '@/repositories/sales/prisma/prisma-contacts-repository';
import { UpdateContactUseCase } from '@/use-cases/sales/contacts/update-contact';

export function makeUpdateContactUseCase() {
  const contactsRepository = new PrismaContactsRepository();
  return new UpdateContactUseCase(contactsRepository);
}
