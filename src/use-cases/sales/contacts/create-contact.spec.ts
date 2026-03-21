import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateContactUseCase } from './create-contact';

let contactsRepository: InMemoryContactsRepository;
let customersRepository: InMemoryCustomersRepository;
let sut: CreateContactUseCase;

describe('Create Contact Use Case', () => {
  const TENANT_ID = 'tenant-1';
  let customerId: string;

  beforeEach(async () => {
    contactsRepository = new InMemoryContactsRepository();
    customersRepository = new InMemoryCustomersRepository();
    sut = new CreateContactUseCase(contactsRepository, customersRepository);

    const customer = await customersRepository.create({
      tenantId: TENANT_ID,
      name: 'Acme Corp',
      type: 'COMPANY' as any,
    });
    customerId = customer.id.toString();
  });

  it('should create a contact', async () => {
    const { contact } = await sut.execute({
      tenantId: TENANT_ID,
      customerId,
      firstName: 'Maria',
    });

    expect(contact.id.toString()).toEqual(expect.any(String));
    expect(contact.firstName).toBe('Maria');
    expect(contactsRepository.items).toHaveLength(1);
  });

  it('should not create a contact with empty first name', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        customerId,
        firstName: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create a contact for non-existent customer', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        customerId: 'non-existent-id',
        firstName: 'Maria',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject invalid role', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        customerId,
        firstName: 'Maria',
        role: 'INVALID_ROLE',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
