import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Contact } from '@/entities/sales/contact';
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteContactUseCase } from './delete-contact';

let contactsRepository: InMemoryContactsRepository;
let sut: DeleteContactUseCase;

describe('Delete Contact Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    contactsRepository = new InMemoryContactsRepository();
    sut = new DeleteContactUseCase(contactsRepository);
  });

  it('should delete a contact', async () => {
    const contact = Contact.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('cust-1'),
      firstName: 'Maria',
    });
    contactsRepository.items.push(contact);

    await sut.execute({ id: contact.id.toString(), tenantId: TENANT_ID });

    expect(contactsRepository.items).toHaveLength(0);
  });

  it('should throw if contact not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
