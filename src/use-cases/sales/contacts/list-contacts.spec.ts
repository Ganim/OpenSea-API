import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Contact } from '@/entities/sales/contact';
import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListContactsUseCase } from './list-contacts';

let contactsRepository: InMemoryContactsRepository;
let sut: ListContactsUseCase;

describe('List Contacts Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    contactsRepository = new InMemoryContactsRepository();
    sut = new ListContactsUseCase(contactsRepository);
  });

  it('should list contacts with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      contactsRepository.items.push(
        Contact.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          customerId: new UniqueEntityID('cust-1'),
          firstName: `Contact ${i}`,
          role: ContactRole.create('DECISION_MAKER'),
          source: 'MANUAL',
          lifecycleStage: LifecycleStage.create('LEAD'),
        }),
      );
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 3,
    });

    expect(result.contacts).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no contacts', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
    });

    expect(result.contacts).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
