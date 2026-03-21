import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateContactUseCase } from './create-contact';

let contactsRepository: InMemoryContactsRepository;
let customersRepository: InMemoryCustomersRepository;
let sut: CreateContactUseCase;

const TENANT_ID = 'tenant-1';
let customerId: string;

describe('CreateContactUseCase', () => {
  beforeEach(async () => {
    contactsRepository = new InMemoryContactsRepository();
    customersRepository = new InMemoryCustomersRepository();
    sut = new CreateContactUseCase(contactsRepository, customersRepository);

    // Create a customer for contact association
    const customer = await customersRepository.create({
      tenantId: TENANT_ID,
      name: 'Empresa Demo',
      type: CustomerType.create('BUSINESS'),
    });
    customerId = customer.id.toString();
  });

  it('should create a contact with minimum fields', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      customerId,
      firstName: 'John',
    });

    expect(result.contact.id).toBeDefined();
    expect(result.contact.firstName).toBe('John');
    expect(result.contact.customerId.toString()).toBe(customerId);
    expect(result.contact.tenantId.toString()).toBe(TENANT_ID);
    expect(result.contact.role.value).toBe('OTHER');
    expect(result.contact.lifecycleStage.value).toBe('LEAD');
    expect(result.contact.source).toBe('MANUAL');
  });

  it('should create a contact with all fields', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      customerId,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '+5511999999999',
      whatsapp: '+5511999999999',
      role: 'DECISION_MAKER',
      jobTitle: 'CTO',
      department: 'Engineering',
      lifecycleStage: 'QUALIFIED',
      leadScore: 85,
      leadTemperature: 'HOT',
      source: 'WEBSITE',
      tags: ['vip', 'tech'],
      customFields: { preferredLanguage: 'pt-BR' },
      avatarUrl: 'https://example.com/avatar.png',
      isMainContact: true,
    });

    expect(result.contact.firstName).toBe('Jane');
    expect(result.contact.lastName).toBe('Doe');
    expect(result.contact.email).toBe('jane@example.com');
    expect(result.contact.phone).toBe('+5511999999999');
    expect(result.contact.whatsapp).toBe('+5511999999999');
    expect(result.contact.role.value).toBe('DECISION_MAKER');
    expect(result.contact.jobTitle).toBe('CTO');
    expect(result.contact.department).toBe('Engineering');
    expect(result.contact.lifecycleStage.value).toBe('QUALIFIED');
    expect(result.contact.leadScore).toBe(85);
    expect(result.contact.leadTemperature).toBe('HOT');
    expect(result.contact.source).toBe('WEBSITE');
    expect(result.contact.tags).toEqual(['vip', 'tech']);
    expect(result.contact.isMainContact).toBe(true);
  });

  it('should throw BadRequestError when firstName is empty', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        customerId,
        firstName: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when firstName is only whitespace', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        customerId,
        firstName: '   ',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw ResourceNotFoundError when customer does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        customerId: 'non-existent-customer-id',
        firstName: 'John',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError on invalid lifecycleStage', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        customerId,
        firstName: 'John',
        lifecycleStage: 'INVALID_STAGE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError on invalid role', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        customerId,
        firstName: 'John',
        role: 'INVALID_ROLE',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
