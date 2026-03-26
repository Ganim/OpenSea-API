import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOvertimeRepository } from '@/repositories/hr/in-memory/in-memory-overtime-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RejectOvertimeUseCase } from './reject-overtime';

const TENANT_ID = 'tenant-1';

let overtimeRepository: InMemoryOvertimeRepository;
let sut: RejectOvertimeUseCase;

describe('Reject Overtime Use Case', () => {
  beforeEach(() => {
    overtimeRepository = new InMemoryOvertimeRepository();
    sut = new RejectOvertimeUseCase(overtimeRepository);
  });

  it('should reject overtime request', async () => {
    const employeeId = new UniqueEntityID();
    const rejecterId = new UniqueEntityID();

    const overtime = await overtimeRepository.create({
      tenantId: TENANT_ID,
      employeeId,
      date: new Date('2024-01-15'),
      hours: 2,
      reason: 'Project deadline',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      overtimeId: overtime.id.toString(),
      rejectedBy: rejecterId.toString(),
    });

    expect(result.overtime.rejected).toBe(true);
    expect(result.overtime.rejectedBy?.equals(rejecterId)).toBe(true);
    expect(result.overtime.rejectedAt).toBeDefined();
  });

  it('should reject overtime request with reason', async () => {
    const employeeId = new UniqueEntityID();
    const rejecterId = new UniqueEntityID();

    const overtime = await overtimeRepository.create({
      tenantId: TENANT_ID,
      employeeId,
      date: new Date('2024-01-15'),
      hours: 2,
      reason: 'Project deadline',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      overtimeId: overtime.id.toString(),
      rejectedBy: rejecterId.toString(),
      rejectionReason: 'Budget constraints do not allow overtime this period',
    });

    expect(result.overtime.rejected).toBe(true);
    expect(result.overtime.rejectionReason).toBe(
      'Budget constraints do not allow overtime this period',
    );
  });

  it('should throw error if overtime not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        overtimeId: new UniqueEntityID().toString(),
        rejectedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Overtime request not found');
  });

  it('should throw error if already approved', async () => {
    const employeeId = new UniqueEntityID();
    const approverId = new UniqueEntityID();
    const rejecterId = new UniqueEntityID();

    const overtime = await overtimeRepository.create({
      tenantId: TENANT_ID,
      employeeId,
      date: new Date('2024-01-15'),
      hours: 2,
      reason: 'Project deadline',
    });

    // Approve first
    overtime.approve(approverId);
    await overtimeRepository.save(overtime);

    // Try to reject
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        overtimeId: overtime.id.toString(),
        rejectedBy: rejecterId.toString(),
      }),
    ).rejects.toThrow('Cannot reject an already approved overtime request');
  });

  it('should throw error if already rejected', async () => {
    const employeeId = new UniqueEntityID();
    const rejecterId = new UniqueEntityID();

    const overtime = await overtimeRepository.create({
      tenantId: TENANT_ID,
      employeeId,
      date: new Date('2024-01-15'),
      hours: 2,
      reason: 'Project deadline',
    });

    // Reject once
    await sut.execute({
      tenantId: TENANT_ID,
      overtimeId: overtime.id.toString(),
      rejectedBy: rejecterId.toString(),
    });

    // Try to reject again
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        overtimeId: overtime.id.toString(),
        rejectedBy: rejecterId.toString(),
      }),
    ).rejects.toThrow('Overtime request is already rejected');
  });
});
