import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Contact } from '@/entities/sales/contact';
import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateContactUseCase } from './update-contact';

let contactsRepository: InMemoryContactsRepository;
let sut: UpdateContactUseCase;

describe('Update Contact Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    contactsRepository = new InMemoryContactsRepository();
    sut = new UpdateContactUseCase(contactsRepository);
  });

  it('should update a contact', async () => {
    const contact = Contact.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('cust-1'),
      firstName: 'Maria',
      role: ContactRole.create('DECISION_MAKER'),
      source: 'MANUAL',
      lifecycleStage: LifecycleStage.create('LEAD'),
    });
    contactsRepository.items.push(contact);

    const result = await sut.execute({
      id: contact.id.toString(),
      tenantId: TENANT_ID,
      firstName: 'Maria Atualizada',
    });

    expect(result.contact.firstName).toBe('Maria Atualizada');
  });

  it('should throw if contact not found', async () => {
    await expect(() =>
      sut.execute({
        id: 'non-existent',
        tenantId: TENANT_ID,
        firstName: 'Test',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject invalid role', async () => {
    const contact = Contact.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('cust-1'),
      firstName: 'Maria',
      role: ContactRole.create('DECISION_MAKER'),
      source: 'MANUAL',
      lifecycleStage: LifecycleStage.create('LEAD'),
    });
    contactsRepository.items.push(contact);

    await expect(() =>
      sut.execute({
        id: contact.id.toString(),
        tenantId: TENANT_ID,
        role: 'INVALID_ROLE',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
