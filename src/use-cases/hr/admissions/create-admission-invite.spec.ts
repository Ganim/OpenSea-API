import { InMemoryAdmissionsRepository } from '@/repositories/hr/in-memory/in-memory-admissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateAdmissionInviteUseCase } from './create-admission-invite';

let admissionsRepository: InMemoryAdmissionsRepository;
let sut: CreateAdmissionInviteUseCase;
const tenantId = 'tenant-123';

describe('Create Admission Invite Use Case', () => {
  beforeEach(() => {
    admissionsRepository = new InMemoryAdmissionsRepository();
    sut = new CreateAdmissionInviteUseCase(admissionsRepository);
  });

  it('should create an admission invite successfully', async () => {
    const { invite } = await sut.execute({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      positionId: 'pos-123',
      departmentId: 'dept-123',
      salary: 5000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      expiresInDays: 14,
    });

    expect(invite).toBeDefined();
    expect(invite.id).toBeDefined();
    expect(invite.token).toBeDefined();
    expect(invite.fullName).toBe('Maria Santos');
    expect(invite.email).toBe('maria@example.com');
    expect(invite.status).toBe('PENDING');
    expect(invite.salary).toBe(5000);
    expect(invite.contractType).toBe('CLT');
    expect(invite.expiresAt).toBeDefined();
    expect(admissionsRepository.invites).toHaveLength(1);
  });

  it('should create an invite with phone only (no email)', async () => {
    const { invite } = await sut.execute({
      tenantId,
      fullName: 'João Silva',
      phone: '11999998888',
    });

    expect(invite.phone).toBe('11999998888');
    expect(invite.email).toBeNull();
    expect(invite.status).toBe('PENDING');
  });

  it('should set default expiresAt to 7 days from now', async () => {
    const beforeExecution = new Date();

    const { invite } = await sut.execute({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    const expectedMinExpires = new Date(beforeExecution);
    expectedMinExpires.setDate(expectedMinExpires.getDate() + 7);

    expect(invite.expiresAt).toBeDefined();
    expect(invite.expiresAt!.getTime()).toBeGreaterThanOrEqual(
      expectedMinExpires.getTime() - 1000,
    );
  });

  it('should throw if fullName is too short', async () => {
    await expect(
      sut.execute({
        tenantId,
        fullName: 'A',
        email: 'test@example.com',
      }),
    ).rejects.toThrow('Full name must have at least 2 characters');
  });

  it('should throw if neither email nor phone is provided', async () => {
    await expect(
      sut.execute({
        tenantId,
        fullName: 'João Silva',
      }),
    ).rejects.toThrow(
      'At least one contact method (email or phone) is required',
    );
  });

  it('should trim fullName whitespace', async () => {
    const { invite } = await sut.execute({
      tenantId,
      fullName: '  Maria Santos  ',
      email: 'maria@example.com',
    });

    expect(invite.fullName).toBe('Maria Santos');
  });

  it('should store createdBy when provided', async () => {
    const { invite } = await sut.execute({
      tenantId,
      fullName: 'Carlos Lima',
      email: 'carlos@example.com',
      createdBy: 'user-admin-123',
    });

    expect(invite.createdBy).toBe('user-admin-123');
  });
});
