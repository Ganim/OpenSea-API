import { PrismaContactsRepository } from '@/repositories/sales/prisma/prisma-contacts-repository';
import { DeleteContactUseCase } from '@/use-cases/sales/contacts/delete-contact';

export function makeDeleteContactUseCase() {
  const contactsRepository = new PrismaContactsRepository();
  return new DeleteContactUseCase(contactsRepository);
}
