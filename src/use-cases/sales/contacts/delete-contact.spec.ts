import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { InMemoryContactsRepository } from '@/repositories/sales/in-memory/in-memory-contacts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteContactUseCase } from './delete-contact';

let contactsRepository: InMemoryContactsRepository;
let sut: DeleteContactUseCase;

const TENANT_ID = 'tenant-1';
const CUSTOMER_ID = 'customer-1';

describe('DeleteContactUseCase', () => {
  beforeEach(() => {
    contactsRepository = new InMemoryContactsRepository();
    sut = new DeleteContactUseCase(contactsRepository);
  });

  it('should soft delete contact (sets deletedAt)', async () => {
    const created = await contactsRepository.create({
      tenantId: TENANT_ID,
      customerId: CUSTOMER_ID,
      firstName: 'John',
      role: ContactRole.create('OTHER'),
      source: 'MANUAL',
    });

    await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
    });

    // Contact should still exist in items but have deletedAt set
    const contactInRepo = contactsRepository.items.find((item) =>
      item.id.equals(created.id),
    );
    expect(contactInRepo).toBeDefined();
    expect(contactInRepo!.deletedAt).toBeDefined();
    expect(contactInRepo!.isDeleted).toBe(true);

    // findById should no longer return it (soft deleted)
    const notFound = await contactsRepository.findById(
      created.id,
      TENANT_ID,
    );
    expect(notFound).toBeNull();
  });

  it('should throw ResourceNotFoundError when not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
