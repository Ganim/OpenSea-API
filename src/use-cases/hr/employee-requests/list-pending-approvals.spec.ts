import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeRequest } from '@/entities/hr/employee-request';
import { InMemoryEmployeeRequestsRepository } from '@/repositories/hr/in-memory/in-memory-employee-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPendingApprovalsUseCase } from './list-pending-approvals';

let employeeRequestsRepository: InMemoryEmployeeRequestsRepository;
let sut: ListPendingApprovalsUseCase;

const tenantId = new UniqueEntityID().toString();
const approverEmployeeId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

function createTestRequest(
  overrides: Partial<{
    tenantId: string;
    employeeId: string;
    type: 'VACATION' | 'ABSENCE' | 'ADVANCE' | 'DATA_CHANGE' | 'SUPPORT';
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  }> = {},
): EmployeeRequest {
  return EmployeeRequest.create({
    tenantId: new UniqueEntityID(overrides.tenantId ?? tenantId),
    employeeId: new UniqueEntityID(overrides.employeeId ?? employeeId),
    type: overrides.type ?? 'VACATION',
    status: overrides.status ?? 'PENDING',
    data: {},
  });
}

describe('List Pending Approvals Use Case', () => {
  beforeEach(() => {
    employeeRequestsRepository = new InMemoryEmployeeRequestsRepository();
    sut = new ListPendingApprovalsUseCase(employeeRequestsRepository);
  });

  it('should list pending requests for approval', async () => {
    await employeeRequestsRepository.create(createTestRequest());
    await employeeRequestsRepository.create(
      createTestRequest({ type: 'ADVANCE' }),
    );

    const result = await sut.execute({
      tenantId,
      approverEmployeeId,
      page: 1,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.employeeRequests.every((r) => r.isPending())).toBe(true);
  });

  it('should not include approved requests', async () => {
    const pendingRequest = createTestRequest();
    const approvedRequest = createTestRequest({ type: 'ABSENCE' });
    approvedRequest.approve(new UniqueEntityID(approverEmployeeId));

    await employeeRequestsRepository.create(pendingRequest);
    await employeeRequestsRepository.create(approvedRequest);

    const result = await sut.execute({
      tenantId,
      approverEmployeeId,
      page: 1,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(1);
    expect(result.employeeRequests[0].isPending()).toBe(true);
  });

  it('should not include rejected requests', async () => {
    const pendingRequest = createTestRequest();
    const rejectedRequest = createTestRequest({ type: 'DATA_CHANGE' });
    rejectedRequest.reject(new UniqueEntityID(approverEmployeeId), 'Not valid');

    await employeeRequestsRepository.create(pendingRequest);
    await employeeRequestsRepository.create(rejectedRequest);

    const result = await sut.execute({
      tenantId,
      approverEmployeeId,
      page: 1,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(1);
  });

  it('should not include cancelled requests', async () => {
    const pendingRequest = createTestRequest();
    const cancelledRequest = createTestRequest({ type: 'SUPPORT' });
    cancelledRequest.cancel();

    await employeeRequestsRepository.create(pendingRequest);
    await employeeRequestsRepository.create(cancelledRequest);

    const result = await sut.execute({
      tenantId,
      approverEmployeeId,
      page: 1,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(1);
  });

  it('should not include requests from other tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    await employeeRequestsRepository.create(createTestRequest());
    await employeeRequestsRepository.create(
      createTestRequest({ tenantId: otherTenantId }),
    );

    const result = await sut.execute({
      tenantId,
      approverEmployeeId,
      page: 1,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should paginate results correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await employeeRequestsRepository.create(createTestRequest());
    }

    const firstPage = await sut.execute({
      tenantId,
      approverEmployeeId,
      page: 1,
      limit: 2,
    });

    expect(firstPage.employeeRequests).toHaveLength(2);
    expect(firstPage.total).toBe(5);

    const secondPage = await sut.execute({
      tenantId,
      approverEmployeeId,
      page: 2,
      limit: 2,
    });

    expect(secondPage.employeeRequests).toHaveLength(2);
    expect(secondPage.total).toBe(5);
  });

  it('should return empty list when no pending approvals exist', async () => {
    const result = await sut.execute({
      tenantId,
      approverEmployeeId,
      page: 1,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
