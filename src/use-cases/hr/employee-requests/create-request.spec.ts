import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryEmployeeRequestsRepository } from '@/repositories/hr/in-memory/in-memory-employee-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateRequestUseCase } from './create-request';

let employeeRequestsRepository: InMemoryEmployeeRequestsRepository;
let sut: CreateRequestUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

describe('Create Request Use Case', () => {
  beforeEach(() => {
    employeeRequestsRepository = new InMemoryEmployeeRequestsRepository();
    sut = new CreateRequestUseCase(employeeRequestsRepository);
  });

  it('should create a VACATION request successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'VACATION',
      data: { startDate: '2026-04-01', endDate: '2026-04-15', days: 15 },
    });

    expect(result.employeeRequest).toBeDefined();
    expect(result.employeeRequest.type).toBe('VACATION');
    expect(result.employeeRequest.status).toBe('PENDING');
    expect(result.employeeRequest.employeeId.toString()).toBe(employeeId);
    expect(result.employeeRequest.tenantId.toString()).toBe(tenantId);
    expect(result.employeeRequest.data).toEqual({
      startDate: '2026-04-01',
      endDate: '2026-04-15',
      days: 15,
    });
  });

  it('should create an ABSENCE request successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'ABSENCE',
      data: { reason: 'Medical appointment', date: '2026-04-10' },
    });

    expect(result.employeeRequest.type).toBe('ABSENCE');
    expect(result.employeeRequest.isPending()).toBe(true);
  });

  it('should create an ADVANCE request successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'ADVANCE',
      data: { amount: 2000, reason: 'Emergency' },
    });

    expect(result.employeeRequest.type).toBe('ADVANCE');
    expect(result.employeeRequest.data).toEqual({
      amount: 2000,
      reason: 'Emergency',
    });
  });

  it('should create a DATA_CHANGE request successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'DATA_CHANGE',
      data: { field: 'address', newValue: 'Rua Nova, 123' },
    });

    expect(result.employeeRequest.type).toBe('DATA_CHANGE');
  });

  it('should create a SUPPORT request successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'SUPPORT',
      data: { subject: 'IT issue', description: 'Cannot access system' },
    });

    expect(result.employeeRequest.type).toBe('SUPPORT');
  });

  it('should set status to PENDING on creation', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'VACATION',
      data: {},
    });

    expect(result.employeeRequest.status).toBe('PENDING');
    expect(result.employeeRequest.isPending()).toBe(true);
    expect(result.employeeRequest.approverEmployeeId).toBeUndefined();
    expect(result.employeeRequest.approvedAt).toBeUndefined();
    expect(result.employeeRequest.rejectionReason).toBeUndefined();
  });

  it('should persist the request in the repository', async () => {
    await sut.execute({
      tenantId,
      employeeId,
      type: 'VACATION',
      data: { days: 10 },
    });

    expect(employeeRequestsRepository.items).toHaveLength(1);
    expect(employeeRequestsRepository.items[0].type).toBe('VACATION');
  });

  it('should store the data JSON payload', async () => {
    const requestData = {
      startDate: '2026-05-01',
      endDate: '2026-05-10',
      sellDays: 10,
      splitCount: 2,
    };

    const result = await sut.execute({
      tenantId,
      employeeId,
      type: 'VACATION',
      data: requestData,
    });

    expect(result.employeeRequest.data).toEqual(requestData);
  });

  it('should throw error for invalid request type', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId,
        type: 'INVALID_TYPE',
        data: {},
      }),
    ).rejects.toThrow('Invalid request type: INVALID_TYPE');
  });

  it('should throw error for empty string type', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId,
        type: '',
        data: {},
      }),
    ).rejects.toThrow('Invalid request type');
  });

  it('should create multiple requests for the same employee', async () => {
    await sut.execute({
      tenantId,
      employeeId,
      type: 'VACATION',
      data: { days: 10 },
    });

    await sut.execute({
      tenantId,
      employeeId,
      type: 'ADVANCE',
      data: { amount: 500 },
    });

    expect(employeeRequestsRepository.items).toHaveLength(2);
  });

  it('should assign unique IDs to each request', async () => {
    const firstResult = await sut.execute({
      tenantId,
      employeeId,
      type: 'VACATION',
      data: {},
    });

    const secondResult = await sut.execute({
      tenantId,
      employeeId,
      type: 'ABSENCE',
      data: {},
    });

    expect(firstResult.employeeRequest.id.toString()).not.toBe(
      secondResult.employeeRequest.id.toString(),
    );
  });
});
