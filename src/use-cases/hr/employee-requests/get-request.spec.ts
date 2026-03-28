import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeRequest } from '@/entities/hr/employee-request';
import { InMemoryEmployeeRequestsRepository } from '@/repositories/hr/in-memory/in-memory-employee-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetRequestUseCase } from './get-request';

let employeeRequestsRepository: InMemoryEmployeeRequestsRepository;
let sut: GetRequestUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();
const anotherEmployeeId = new UniqueEntityID().toString();

describe('Get Request Use Case', () => {
  beforeEach(() => {
    employeeRequestsRepository = new InMemoryEmployeeRequestsRepository();
    sut = new GetRequestUseCase(employeeRequestsRepository);
  });

  it('should get own request by id successfully', async () => {
    const vacationRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'VACATION',
      status: 'PENDING',
      data: { days: 15, startDate: '2026-05-01' },
    });

    await employeeRequestsRepository.create(vacationRequest);

    const result = await sut.execute({
      tenantId,
      requestId: vacationRequest.id.toString(),
      employeeId,
    });

    expect(result.employeeRequest).toBeDefined();
    expect(result.employeeRequest.id.equals(vacationRequest.id)).toBe(true);
    expect(result.employeeRequest.type).toBe('VACATION');
    expect(result.employeeRequest.data).toEqual({
      days: 15,
      startDate: '2026-05-01',
    });
  });

  it('should throw error when request not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        requestId: new UniqueEntityID().toString(),
        employeeId,
      }),
    ).rejects.toThrow('Employee request not found');
  });

  it('should throw error when employee tries to view another employees request', async () => {
    const otherEmployeeRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(anotherEmployeeId),
      type: 'ADVANCE',
      status: 'PENDING',
      data: { amount: 2000 },
    });

    await employeeRequestsRepository.create(otherEmployeeRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: otherEmployeeRequest.id.toString(),
        employeeId, // not the owner
      }),
    ).rejects.toThrow('Employee request not found');
  });

  it('should return request in any status', async () => {
    const approvedRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'DATA_CHANGE',
      status: 'PENDING',
      data: {},
    });

    approvedRequest.approve(new UniqueEntityID(anotherEmployeeId));
    await employeeRequestsRepository.create(approvedRequest);

    const result = await sut.execute({
      tenantId,
      requestId: approvedRequest.id.toString(),
      employeeId,
    });

    expect(result.employeeRequest.status).toBe('APPROVED');
    expect(result.employeeRequest.isApproved()).toBe(true);
  });

  it('should not find request from a different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();
    const requestInOtherTenant = EmployeeRequest.create({
      tenantId: new UniqueEntityID(differentTenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'SUPPORT',
      status: 'PENDING',
      data: {},
    });

    await employeeRequestsRepository.create(requestInOtherTenant);

    await expect(
      sut.execute({
        tenantId,
        requestId: requestInOtherTenant.id.toString(),
        employeeId,
      }),
    ).rejects.toThrow('Employee request not found');
  });
});
