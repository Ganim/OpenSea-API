import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeRequest } from '@/entities/hr/employee-request';
import { InMemoryEmployeeRequestsRepository } from '@/repositories/hr/in-memory/in-memory-employee-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelRequestUseCase } from './cancel-request';

let employeeRequestsRepository: InMemoryEmployeeRequestsRepository;
let sut: CancelRequestUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();
const anotherEmployeeId = new UniqueEntityID().toString();

describe('Cancel Request Use Case', () => {
  beforeEach(() => {
    employeeRequestsRepository = new InMemoryEmployeeRequestsRepository();
    sut = new CancelRequestUseCase(employeeRequestsRepository);
  });

  it('should cancel own pending request successfully', async () => {
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
      employeeId,
    });

    expect(result.employeeRequest.status).toBe('CANCELLED');
    expect(result.employeeRequest.isCancelled()).toBe(true);
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

  it('should throw error when another employee tries to cancel', async () => {
    const pendingRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'ADVANCE',
      status: 'PENDING',
      data: { amount: 500 },
    });

    await employeeRequestsRepository.create(pendingRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: pendingRequest.id.toString(),
        employeeId: anotherEmployeeId, // not the owner
      }),
    ).rejects.toThrow('You can only cancel your own requests');
  });

  it('should throw error when cancelling an already approved request', async () => {
    const approvedRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'VACATION',
      status: 'PENDING',
      data: {},
    });

    approvedRequest.approve(new UniqueEntityID(anotherEmployeeId));
    await employeeRequestsRepository.create(approvedRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: approvedRequest.id.toString(),
        employeeId,
      }),
    ).rejects.toThrow('Only pending requests can be cancelled');
  });

  it('should throw error when cancelling an already rejected request', async () => {
    const rejectedRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'ABSENCE',
      status: 'PENDING',
      data: {},
    });

    rejectedRequest.reject(new UniqueEntityID(anotherEmployeeId), 'Denied');
    await employeeRequestsRepository.create(rejectedRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: rejectedRequest.id.toString(),
        employeeId,
      }),
    ).rejects.toThrow('Only pending requests can be cancelled');
  });

  it('should throw error when cancelling an already cancelled request', async () => {
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
        employeeId,
      }),
    ).rejects.toThrow('Only pending requests can be cancelled');
  });

  it('should persist the cancelled state in the repository', async () => {
    const pendingRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'DATA_CHANGE',
      status: 'PENDING',
      data: {},
    });

    await employeeRequestsRepository.create(pendingRequest);

    await sut.execute({
      tenantId,
      requestId: pendingRequest.id.toString(),
      employeeId,
    });

    const storedRequest = await employeeRequestsRepository.findById(
      pendingRequest.id,
      tenantId,
    );

    expect(storedRequest?.status).toBe('CANCELLED');
  });

  it('should enforce ownership check before status check', async () => {
    // An approved request owned by someone else should fail on ownership, not status
    const approvedRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'VACATION',
      status: 'PENDING',
      data: {},
    });

    approvedRequest.approve(new UniqueEntityID(anotherEmployeeId));
    await employeeRequestsRepository.create(approvedRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: approvedRequest.id.toString(),
        employeeId: anotherEmployeeId,
      }),
    ).rejects.toThrow('You can only cancel your own requests');
  });
});
