import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetContactByIdUseCase } from './get-contact-by-id';

let contactsRepository: InMemoryContactsRepository;
let sut: GetContactByIdUseCase;

const TENANT_ID = 'tenant-1';
const CUSTOMER_ID = 'customer-1';

describe('GetContactByIdUseCase', () => {
  beforeEach(() => {
    contactsRepository = new InMemoryContactsRepository();
    sut = new GetContactByIdUseCase(contactsRepository);
  });

  it('should return contact when found', async () => {
    const created = await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: ContactRole.create('DECISION_MAKER'),
      source: 'MANUAL',
    });

    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.contact.id.equals(created.id)).toBe(true);
    expect(result.contact.firstName).toBe('John');
    expect(result.contact.lastName).toBe('Doe');
    expect(result.contact.email).toBe('john@example.com');
  });

  it('should throw ResourceNotFoundError when not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when contact belongs to different tenant', async () => {
    const created = await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'John',
      role: ContactRole.create('OTHER'),
      source: 'MANUAL',
    });

    await expect(
      sut.execute({
        id: created.id.toString(),
        tenantId: 'different-tenant',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
