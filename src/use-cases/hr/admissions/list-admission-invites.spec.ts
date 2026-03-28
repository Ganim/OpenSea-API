import { InMemoryAdmissionsRepository } from '@/repositories/hr/in-memory/in-memory-admissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAdmissionInvitesUseCase } from './list-admission-invites';

let admissionsRepository: InMemoryAdmissionsRepository;
let sut: ListAdmissionInvitesUseCase;
const tenantId = 'tenant-123';

describe('List Admission Invites Use Case', () => {
  beforeEach(() => {
    admissionsRepository = new InMemoryAdmissionsRepository();
    sut = new ListAdmissionInvitesUseCase(admissionsRepository);
  });

  it('should list admission invites with default pagination', async () => {
    await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
    });

    await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    const { invites, meta } = await sut.execute({ tenantId });

    expect(invites).toHaveLength(2);
    expect(meta.total).toBe(2);
    expect(meta.page).toBe(1);
    expect(meta.perPage).toBe(20);
    expect(meta.totalPages).toBe(1);
  });

  it('should paginate results correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await admissionsRepository.create({
        tenantId,
        fullName: `Candidate ${i + 1}`,
        email: `candidate${i + 1}@example.com`,
      });
    }

    const firstPage = await sut.execute({ tenantId, page: 1, perPage: 2 });
    expect(firstPage.invites).toHaveLength(2);
    expect(firstPage.meta.total).toBe(5);
    expect(firstPage.meta.totalPages).toBe(3);
    expect(firstPage.meta.page).toBe(1);

    const secondPage = await sut.execute({ tenantId, page: 2, perPage: 2 });
    expect(secondPage.invites).toHaveLength(2);
    expect(secondPage.meta.page).toBe(2);

    const thirdPage = await sut.execute({ tenantId, page: 3, perPage: 2 });
    expect(thirdPage.invites).toHaveLength(1);
    expect(thirdPage.meta.page).toBe(3);
  });

  it('should filter by status', async () => {
    const pendingInvite = await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
    });

    await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    await admissionsRepository.update({
      id: pendingInvite.id,
      status: 'IN_PROGRESS',
    });

    const { invites, meta } = await sut.execute({
      tenantId,
      status: 'PENDING',
    });

    expect(invites).toHaveLength(1);
    expect(invites[0].fullName).toBe('João Silva');
    expect(meta.total).toBe(1);
  });

  it('should filter by search term on fullName', async () => {
    await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
    });

    await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Oliveira',
      email: 'moliveira@example.com',
    });

    const { invites, meta } = await sut.execute({
      tenantId,
      search: 'Maria',
    });

    expect(invites).toHaveLength(2);
    expect(meta.total).toBe(2);
  });

  it('should filter by search term on email', async () => {
    await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@company.com',
    });

    await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    const { invites } = await sut.execute({
      tenantId,
      search: 'company.com',
    });

    expect(invites).toHaveLength(1);
    expect(invites[0].fullName).toBe('Maria Santos');
  });

  it('should return empty list when no invites match', async () => {
    await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
    });

    const { invites, meta } = await sut.execute({
      tenantId,
      status: 'COMPLETED',
    });

    expect(invites).toHaveLength(0);
    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(0);
  });

  it('should throw on invalid status filter', async () => {
    await expect(
      sut.execute({
        tenantId,
        status: 'INVALID_STATUS',
      }),
    ).rejects.toThrow('Invalid status: INVALID_STATUS');
  });

  it('should only return invites from the specified tenant', async () => {
    await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
    });

    await admissionsRepository.create({
      tenantId: 'other-tenant',
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    const { invites, meta } = await sut.execute({ tenantId });

    expect(invites).toHaveLength(1);
    expect(meta.total).toBe(1);
    expect(invites[0].fullName).toBe('Maria Santos');
  });

  it('should accept case-insensitive status filter', async () => {
    await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
    });

    const { invites } = await sut.execute({
      tenantId,
      status: 'pending',
    });

    expect(invites).toHaveLength(1);
  });

  it('should combine status and search filters', async () => {
    const invite1 = await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
    });

    await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Oliveira',
      email: 'moliveira@example.com',
    });

    await admissionsRepository.update({
      id: invite1.id,
      status: 'IN_PROGRESS',
    });

    const { invites } = await sut.execute({
      tenantId,
      status: 'PENDING',
      search: 'Maria',
    });

    expect(invites).toHaveLength(1);
    expect(invites[0].fullName).toBe('Maria Oliveira');
  });
});
