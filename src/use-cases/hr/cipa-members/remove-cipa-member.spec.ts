import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCipaMembersRepository } from '@/repositories/hr/in-memory/in-memory-cipa-members-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemoveCipaMemberUseCase } from './remove-cipa-member';

let cipaMembersRepository: InMemoryCipaMembersRepository;
let sut: RemoveCipaMemberUseCase;

const TENANT_ID = 'tenant-01';

describe('RemoveCipaMemberUseCase', () => {
  beforeEach(() => {
    cipaMembersRepository = new InMemoryCipaMembersRepository();
    sut = new RemoveCipaMemberUseCase(cipaMembersRepository);
  });

  it('should remove a CIPA member', async () => {
    const createdMember = await cipaMembersRepository.create({
      tenantId: TENANT_ID,
      mandateId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      role: 'MEMBRO_TITULAR',
      type: 'EMPREGADO',
      isStable: true,
    });

    const { cipaMember } = await sut.execute({
      tenantId: TENANT_ID,
      memberId: createdMember.id.toString(),
    });

    expect(cipaMember.id.equals(createdMember.id)).toBe(true);
    expect(cipaMember.role).toBe('MEMBRO_TITULAR');

    const foundMember = await cipaMembersRepository.findById(
      createdMember.id,
      TENANT_ID,
    );
    expect(foundMember).toBeNull();
  });

  it('should throw ResourceNotFoundError when member does not exist', async () => {
    const nonExistentId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        memberId: nonExistentId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when member belongs to another tenant', async () => {
    const createdMember = await cipaMembersRepository.create({
      tenantId: 'another-tenant',
      mandateId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      role: 'SECRETARIO',
      type: 'EMPREGADOR',
      isStable: false,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        memberId: createdMember.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should only remove the specified member and preserve others', async () => {
    const mandateId = new UniqueEntityID();

    const memberToKeep = await cipaMembersRepository.create({
      tenantId: TENANT_ID,
      mandateId,
      employeeId: new UniqueEntityID(),
      role: 'PRESIDENTE',
      type: 'EMPREGADOR',
      isStable: false,
    });

    const memberToRemove = await cipaMembersRepository.create({
      tenantId: TENANT_ID,
      mandateId,
      employeeId: new UniqueEntityID(),
      role: 'MEMBRO_TITULAR',
      type: 'EMPREGADO',
      isStable: true,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      memberId: memberToRemove.id.toString(),
    });

    const remainingMember = await cipaMembersRepository.findById(
      memberToKeep.id,
      TENANT_ID,
    );
    expect(remainingMember).not.toBeNull();
    expect(remainingMember?.role).toBe('PRESIDENTE');

    const removedMember = await cipaMembersRepository.findById(
      memberToRemove.id,
      TENANT_ID,
    );
    expect(removedMember).toBeNull();
  });
});
