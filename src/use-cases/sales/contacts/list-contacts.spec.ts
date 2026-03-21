import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListContactsUseCase } from './list-contacts';

let contactsRepository: InMemoryContactsRepository;
let sut: ListContactsUseCase;

const TENANT_ID = 'tenant-1';
const CUSTOMER_ID = 'customer-1';
const CUSTOMER_ID_2 = 'customer-2';

describe('ListContactsUseCase', () => {
  beforeEach(() => {
    contactsRepository = new InMemoryContactsRepository();
    sut = new ListContactsUseCase(contactsRepository);
  });

  it('should list contacts with pagination', async () => {
    // Create 5 contacts
    for (let i = 1; i <= 5; i++) {
      await contactsRepository.create({
        tenantId: TENANT_ID,
        customerId: CUSTOMER_ID,
        firstName: `Contact ${i}`,
        role: ContactRole.create('OTHER'),
        source: 'MANUAL',
      });
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 2,
    });

    expect(result.contacts).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it('should filter by search (firstName match)', async () => {
    await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'Alice',
      role: ContactRole.create('OTHER'),
      source: 'MANUAL',
    });
    await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'Bob',
      role: ContactRole.create('OTHER'),
      source: 'MANUAL',
    });
    await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'Alicia',
      role: ContactRole.create('OTHER'),
      source: 'MANUAL',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
      search: 'Ali',
    });

    expect(result.contacts).toHaveLength(2);
    expect(result.contacts[0].firstName).toBe('Alice');
    expect(result.contacts[1].firstName).toBe('Alicia');
  });

  it('should filter by customerId', async () => {
    await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'John',
      role: ContactRole.create('OTHER'),
      source: 'MANUAL',
    });
    await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID_2,
      firstName: 'Jane',
      role: ContactRole.create('OTHER'),
      source: 'MANUAL',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
      customerId: CUSTOMER_ID,
    });

    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].firstName).toBe('John');
  });

  it('should filter by lifecycleStage', async () => {
    await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'Lead Contact',
      role: ContactRole.create('OTHER'),
      lifecycleStage: LifecycleStage.create('LEAD'),
      source: 'MANUAL',
    });
    await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'Qualified Contact',
      role: ContactRole.create('OTHER'),
      lifecycleStage: LifecycleStage.create('QUALIFIED'),
      source: 'MANUAL',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
      lifecycleStage: 'QUALIFIED',
    });

    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].firstName).toBe('Qualified Contact');
  });

  it('should return empty list when no contacts', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
    });

    expect(result.contacts).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
