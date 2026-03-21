import { PrismaContactsRepository } from '@/repositories/sales/prisma/prisma-contacts-repository';
import { ListContactsUseCase } from '@/use-cases/sales/contacts/list-contacts';

export function makeListContactsUseCase() {
  const contactsRepository = new PrismaContactsRepository();
  return new ListContactsUseCase(contactsRepository);
}
