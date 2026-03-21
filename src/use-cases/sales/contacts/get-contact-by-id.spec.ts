import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Contact } from '@/entities/sales/contact';
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetContactByIdUseCase } from './get-contact-by-id';

let contactsRepository: InMemoryContactsRepository;
let sut: GetContactByIdUseCase;

describe('Get Contact By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    contactsRepository = new InMemoryContactsRepository();
    sut = new GetContactByIdUseCase(contactsRepository);
  });

  it('should get a contact by id', async () => {
    const contact = Contact.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('cust-1'),
      firstName: 'Maria',
    });
    contactsRepository.items.push(contact);

    const result = await sut.execute({
      id: contact.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.contact.firstName).toBe('Maria');
  });

  it('should throw if contact not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
