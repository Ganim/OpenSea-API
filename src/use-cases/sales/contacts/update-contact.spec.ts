import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateContactUseCase } from './update-contact';

let contactsRepository: InMemoryContactsRepository;
let sut: UpdateContactUseCase;

const TENANT_ID = 'tenant-1';
const CUSTOMER_ID = 'customer-1';

describe('UpdateContactUseCase', () => {
  beforeEach(() => {
    contactsRepository = new InMemoryContactsRepository();
    sut = new UpdateContactUseCase(contactsRepository);
  });

  it('should update single field (firstName)', async () => {
    const created = await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'John',
      role: ContactRole.create('OTHER'),
      source: 'MANUAL',
    });

    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
      firstName: 'Jonathan',
    });

    expect(result.contact.firstName).toBe('Jonathan');
  });

  it('should update multiple fields', async () => {
    const created = await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'John',
      role: ContactRole.create('OTHER'),
      source: 'MANUAL',
    });

    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '+5511888888888',
      jobTitle: 'CEO',
      department: 'Executive',
    });

    expect(result.contact.firstName).toBe('Jane');
    expect(result.contact.lastName).toBe('Smith');
    expect(result.contact.email).toBe('jane@example.com');
    expect(result.contact.phone).toBe('+5511888888888');
    expect(result.contact.jobTitle).toBe('CEO');
    expect(result.contact.department).toBe('Executive');
  });

  it('should update lifecycleStage', async () => {
    const created = await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'John',
      role: ContactRole.create('OTHER'),
      lifecycleStage: LifecycleStage.create('LEAD'),
      source: 'MANUAL',
    });

    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
      lifecycleStage: 'CUSTOMER',
    });

    expect(result.contact.lifecycleStage.value).toBe('CUSTOMER');
  });

  it('should throw ResourceNotFoundError when not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: TENANT_ID,
        firstName: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError for invalid lifecycleStage', async () => {
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
        tenantId: TENANT_ID,
        lifecycleStage: 'INVALID_STAGE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError for invalid role', async () => {
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
        tenantId: TENANT_ID,
        role: 'INVALID_ROLE',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
