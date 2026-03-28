import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeRequest } from '@/entities/hr/employee-request';
import { InMemoryEmployeeRequestsRepository } from '@/repositories/hr/in-memory/in-memory-employee-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApproveRequestUseCase } from './approve-request';

let employeeRequestsRepository: InMemoryEmployeeRequestsRepository;
let sut: ApproveRequestUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();
const approverEmployeeId = new UniqueEntityID().toString();

describe('Approve Request Use Case', () => {
  beforeEach(() => {
    employeeRequestsRepository = new InMemoryEmployeeRequestsRepository();
    sut = new ApproveRequestUseCase(employeeRequestsRepository);
  });

  it('should approve a pending request successfully', async () => {
    const pendingRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'VACATION',
      status: 'PENDING',
      data: { days: 10 },
    });

    await employeeRequestsRepository.create(pendingRequest);

    const result = await sut.execute({
      tenantId,
      requestId: pendingRequest.id.toString(),
      approverEmployeeId,
    });

    expect(result.employeeRequest.status).toBe('APPROVED');
    expect(result.employeeRequest.isApproved()).toBe(true);
    expect(result.employeeRequest.approverEmployeeId?.toString()).toBe(
      approverEmployeeId,
    );
    expect(result.employeeRequest.approvedAt).toBeInstanceOf(Date);
  });

  it('should throw error when request not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        requestId: new UniqueEntityID().toString(),
        approverEmployeeId,
      }),
    ).rejects.toThrow('Employee request not found');
  });

  it('should throw error when approving an already approved request', async () => {
    const approvedRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'ADVANCE',
      status: 'PENDING',
      data: {},
    });

    approvedRequest.approve(new UniqueEntityID(approverEmployeeId));
    await employeeRequestsRepository.create(approvedRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: approvedRequest.id.toString(),
        approverEmployeeId,
      }),
    ).rejects.toThrow('Only pending requests can be approved');
  });

  it('should throw error when approving a rejected request', async () => {
    const rejectedRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'ABSENCE',
      status: 'PENDING',
      data: {},
    });

    rejectedRequest.reject(
      new UniqueEntityID(approverEmployeeId),
      'Budget exceeded',
    );
    await employeeRequestsRepository.create(rejectedRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: rejectedRequest.id.toString(),
        approverEmployeeId,
      }),
    ).rejects.toThrow('Only pending requests can be approved');
  });

  it('should throw error when approving a cancelled request', async () => {
    const cancelledRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'SUPPORT',
      status: 'PENDING',
      data: {},
    });

    cancelledRequest.cancel();
    await employeeRequestsRepository.create(cancelledRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: cancelledRequest.id.toString(),
        approverEmployeeId,
      }),
    ).rejects.toThrow('Only pending requests can be approved');
  });

  it('should prevent self-approval', async () => {
    const selfRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'ADVANCE',
      status: 'PENDING',
      data: { amount: 1000 },
    });

    await employeeRequestsRepository.create(selfRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: selfRequest.id.toString(),
        approverEmployeeId: employeeId, // same as the requester
      }),
    ).rejects.toThrow('Cannot approve your own request');
  });

  it('should persist the approved state in the repository', async () => {
    const pendingRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'DATA_CHANGE',
      status: 'PENDING',
      data: { field: 'phone' },
    });

    await employeeRequestsRepository.create(pendingRequest);

    await sut.execute({
      tenantId,
      requestId: pendingRequest.id.toString(),
      approverEmployeeId,
    });

    const storedRequest = await employeeRequestsRepository.findById(
      pendingRequest.id,
      tenantId,
    );

    expect(storedRequest?.status).toBe('APPROVED');
    expect(storedRequest?.approverEmployeeId?.toString()).toBe(
      approverEmployeeId,
    );
  });

  it('should not find request from a different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();
    const pendingRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(differentTenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'VACATION',
      status: 'PENDING',
      data: {},
    });

    await employeeRequestsRepository.create(pendingRequest);

    await expect(
      sut.execute({
        tenantId, // different from the request's tenant
        requestId: pendingRequest.id.toString(),
        approverEmployeeId,
      }),
    ).rejects.toThrow('Employee request not found');
  });
});
