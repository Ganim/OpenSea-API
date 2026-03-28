import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCipaMembersRepository } from '@/repositories/hr/in-memory/in-memory-cipa-members-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCipaMembersUseCase } from './list-cipa-members';

let cipaMembersRepository: InMemoryCipaMembersRepository;
let sut: ListCipaMembersUseCase;

const TENANT_ID = 'tenant-01';

async function seedCipaMember(
  overrides: Partial<{
    tenantId: string;
    mandateId: UniqueEntityID;
    employeeId: UniqueEntityID;
    role: string;
    type: string;
  }> = {},
) {
  return cipaMembersRepository.create({
    tenantId: overrides.tenantId ?? TENANT_ID,
    mandateId: overrides.mandateId ?? new UniqueEntityID(),
    employeeId: overrides.employeeId ?? new UniqueEntityID(),
    role: overrides.role ?? 'MEMBRO_TITULAR',
    type: overrides.type ?? 'EMPREGADO',
    isStable: true,
  });
}

describe('ListCipaMembersUseCase', () => {
  beforeEach(() => {
    cipaMembersRepository = new InMemoryCipaMembersRepository();
    sut = new ListCipaMembersUseCase(cipaMembersRepository);
  });

  it('should list all members for a tenant', async () => {
    await seedCipaMember();
    await seedCipaMember();
    await seedCipaMember();

    const { cipaMembers } = await sut.execute({ tenantId: TENANT_ID });

    expect(cipaMembers).toHaveLength(3);
  });

  it('should return empty array when tenant has no members', async () => {
    const { cipaMembers } = await sut.execute({ tenantId: TENANT_ID });

    expect(cipaMembers).toHaveLength(0);
  });

  it('should not return members from other tenants', async () => {
    await seedCipaMember({ tenantId: 'another-tenant' });
    await seedCipaMember({ tenantId: TENANT_ID });

    const { cipaMembers } = await sut.execute({ tenantId: TENANT_ID });

    expect(cipaMembers).toHaveLength(1);
  });

  it('should filter members by mandateId', async () => {
    const targetMandateId = new UniqueEntityID();
    const otherMandateId = new UniqueEntityID();

    await seedCipaMember({ mandateId: targetMandateId });
    await seedCipaMember({ mandateId: targetMandateId });
    await seedCipaMember({ mandateId: otherMandateId });

    const { cipaMembers } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: targetMandateId.toString(),
    });

    expect(cipaMembers).toHaveLength(2);
    cipaMembers.forEach((member) => {
      expect(member.mandateId.equals(targetMandateId)).toBe(true);
    });
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await seedCipaMember();
    }

    const firstPage = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 2,
    });

    expect(firstPage.cipaMembers).toHaveLength(2);

    const secondPage = await sut.execute({
      tenantId: TENANT_ID,
      page: 2,
      perPage: 2,
    });

    expect(secondPage.cipaMembers).toHaveLength(2);

    const thirdPage = await sut.execute({
      tenantId: TENANT_ID,
      page: 3,
      perPage: 2,
    });

    expect(thirdPage.cipaMembers).toHaveLength(1);
  });

  it('should return all members when mandateId filter is not provided', async () => {
    const mandateA = new UniqueEntityID();
    const mandateB = new UniqueEntityID();

    await seedCipaMember({ mandateId: mandateA });
    await seedCipaMember({ mandateId: mandateB });

    const { cipaMembers } = await sut.execute({ tenantId: TENANT_ID });

    expect(cipaMembers).toHaveLength(2);
  });
});
