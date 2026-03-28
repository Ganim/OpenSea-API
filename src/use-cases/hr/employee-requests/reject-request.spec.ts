import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeRequest } from '@/entities/hr/employee-request';
import { InMemoryEmployeeRequestsRepository } from '@/repositories/hr/in-memory/in-memory-employee-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RejectRequestUseCase } from './reject-request';

let employeeRequestsRepository: InMemoryEmployeeRequestsRepository;
let sut: RejectRequestUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();
const approverEmployeeId = new UniqueEntityID().toString();

describe('Reject Request Use Case', () => {
  beforeEach(() => {
    employeeRequestsRepository = new InMemoryEmployeeRequestsRepository();
    sut = new RejectRequestUseCase(employeeRequestsRepository);
  });

  it('should reject a pending request successfully', async () => {
    const pendingRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'VACATION',
      status: 'PENDING',
      data: { days: 15 },
    });

    await employeeRequestsRepository.create(pendingRequest);

    const result = await sut.execute({
      tenantId,
      requestId: pendingRequest.id.toString(),
      approverEmployeeId,
      rejectionReason: 'Department is understaffed during this period',
    });

    expect(result.employeeRequest.status).toBe('REJECTED');
    expect(result.employeeRequest.isRejected()).toBe(true);
    expect(result.employeeRequest.approverEmployeeId?.toString()).toBe(
      approverEmployeeId,
    );
    expect(result.employeeRequest.rejectionReason).toBe(
      'Department is understaffed during this period',
    );
  });

  it('should throw error when request not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        requestId: new UniqueEntityID().toString(),
        approverEmployeeId,
        rejectionReason: 'Not applicable',
      }),
    ).rejects.toThrow('Employee request not found');
  });

  it('should throw error when rejecting an already approved request', async () => {
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
        rejectionReason: 'Changed my mind',
      }),
    ).rejects.toThrow('Only pending requests can be rejected');
  });

  it('should throw error when rejecting an already rejected request', async () => {
    const rejectedRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'ABSENCE',
      status: 'PENDING',
      data: {},
    });

    rejectedRequest.reject(new UniqueEntityID(approverEmployeeId), 'Denied');
    await employeeRequestsRepository.create(rejectedRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: rejectedRequest.id.toString(),
        approverEmployeeId,
        rejectionReason: 'Double reject',
      }),
    ).rejects.toThrow('Only pending requests can be rejected');
  });

  it('should throw error when rejecting a cancelled request', async () => {
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
        rejectionReason: 'No longer valid',
      }),
    ).rejects.toThrow('Only pending requests can be rejected');
  });

  it('should throw error when rejection reason is empty', async () => {
    const pendingRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'ADVANCE',
      status: 'PENDING',
      data: { amount: 3000 },
    });

    await employeeRequestsRepository.create(pendingRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: pendingRequest.id.toString(),
        approverEmployeeId,
        rejectionReason: '',
      }),
    ).rejects.toThrow('Rejection reason is required');
  });

  it('should throw error when rejection reason is whitespace only', async () => {
    const pendingRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'DATA_CHANGE',
      status: 'PENDING',
      data: {},
    });

    await employeeRequestsRepository.create(pendingRequest);

    await expect(
      sut.execute({
        tenantId,
        requestId: pendingRequest.id.toString(),
        approverEmployeeId,
        rejectionReason: '   ',
      }),
    ).rejects.toThrow('Rejection reason is required');
  });

  it('should persist the rejected state in the repository', async () => {
    const pendingRequest = EmployeeRequest.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(employeeId),
      type: 'VACATION',
      status: 'PENDING',
      data: {},
    });

    await employeeRequestsRepository.create(pendingRequest);

    await sut.execute({
      tenantId,
      requestId: pendingRequest.id.toString(),
      approverEmployeeId,
      rejectionReason: 'Budget constraints',
    });

    const storedRequest = await employeeRequestsRepository.findById(
      pendingRequest.id,
      tenantId,
    );

    expect(storedRequest?.status).toBe('REJECTED');
    expect(storedRequest?.rejectionReason).toBe('Budget constraints');
  });
});
