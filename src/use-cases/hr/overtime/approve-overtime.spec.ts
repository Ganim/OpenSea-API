import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOvertimeRepository } from '@/repositories/hr/in-memory/in-memory-overtime-repository';
import { InMemoryTimeBankRepository } from '@/repositories/hr/in-memory/in-memory-time-bank-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApproveOvertimeUseCase } from './approve-overtime';

let overtimeRepository: InMemoryOvertimeRepository;
let timeBankRepository: InMemoryTimeBankRepository;
let sut: ApproveOvertimeUseCase;

describe('Approve Overtime Use Case', () => {
  beforeEach(() => {
    overtimeRepository = new InMemoryOvertimeRepository();
    timeBankRepository = new InMemoryTimeBankRepository();
    sut = new ApproveOvertimeUseCase(overtimeRepository, timeBankRepository);
  });

  it('should approve overtime request', async () => {
    const employeeId = new UniqueEntityID();
    const approverId = new UniqueEntityID();

    const overtime = await overtimeRepository.create({
      employeeId,
      date: new Date('2024-01-15'),
      hours: 2,
      reason: 'Project deadline',
    });

    const result = await sut.execute({
      overtimeId: overtime.id.toString(),
      approvedBy: approverId.toString(),
    });

    expect(result.overtime.approved).toBe(true);
    expect(result.overtime.approvedBy?.equals(approverId)).toBe(true);
    expect(result.overtime.approvedAt).toBeDefined();
  });

  it('should add overtime hours to time bank when requested', async () => {
    const employeeId = new UniqueEntityID();
    const approverId = new UniqueEntityID();

    const overtime = await overtimeRepository.create({
      employeeId,
      date: new Date('2024-01-15'),
      hours: 3,
      reason: 'Project deadline',
    });

    await sut.execute({
      overtimeId: overtime.id.toString(),
      approvedBy: approverId.toString(),
      addToTimeBank: true,
    });

    const timeBank = await timeBankRepository.findByEmployeeAndYear(
      employeeId,
      2024,
    );

    expect(timeBank).toBeDefined();
    expect(timeBank?.balance).toBe(3);
  });

  it('should accumulate hours in existing time bank', async () => {
    const employeeId = new UniqueEntityID();
    const approverId = new UniqueEntityID();

    // Create existing time bank with 5 hours
    await timeBankRepository.create({
      employeeId,
      balance: 5,
      year: 2024,
    });

    const overtime = await overtimeRepository.create({
      employeeId,
      date: new Date('2024-01-15'),
      hours: 2,
      reason: 'Project deadline',
    });

    await sut.execute({
      overtimeId: overtime.id.toString(),
      approvedBy: approverId.toString(),
      addToTimeBank: true,
    });

    const timeBank = await timeBankRepository.findByEmployeeAndYear(
      employeeId,
      2024,
    );

    expect(timeBank?.balance).toBe(7); // 5 + 2
  });

  it('should throw error if overtime not found', async () => {
    await expect(
      sut.execute({
        overtimeId: new UniqueEntityID().toString(),
        approvedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Overtime request not found');
  });

  it('should throw error if already approved', async () => {
    const employeeId = new UniqueEntityID();
    const approverId = new UniqueEntityID();

    const overtime = await overtimeRepository.create({
      employeeId,
      date: new Date('2024-01-15'),
      hours: 2,
      reason: 'Project deadline',
    });

    // Approve once
    await sut.execute({
      overtimeId: overtime.id.toString(),
      approvedBy: approverId.toString(),
    });

    // Try to approve again
    await expect(
      sut.execute({
        overtimeId: overtime.id.toString(),
        approvedBy: approverId.toString(),
      }),
    ).rejects.toThrow('Overtime request is already approved');
  });
});
