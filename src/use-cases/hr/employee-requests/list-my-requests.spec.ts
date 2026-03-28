import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeRequest } from '@/entities/hr/employee-request';
import { InMemoryEmployeeRequestsRepository } from '@/repositories/hr/in-memory/in-memory-employee-requests-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListMyRequestsUseCase } from './list-my-requests';

let employeeRequestsRepository: InMemoryEmployeeRequestsRepository;
let sut: ListMyRequestsUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();
const anotherEmployeeId = new UniqueEntityID().toString();

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

describe('List My Requests Use Case', () => {
  beforeEach(() => {
    employeeRequestsRepository = new InMemoryEmployeeRequestsRepository();
    sut = new ListMyRequestsUseCase(employeeRequestsRepository);
  });

  it('should list requests for the given employee', async () => {
    await employeeRequestsRepository.create(createTestRequest());
    await employeeRequestsRepository.create(
      createTestRequest({ type: 'ADVANCE' }),
    );
    await employeeRequestsRepository.create(
      createTestRequest({ type: 'ABSENCE' }),
    );

    const result = await sut.execute({
      tenantId,
      employeeId,
      page: 1,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('should not include requests from other employees', async () => {
    await employeeRequestsRepository.create(createTestRequest());
    await employeeRequestsRepository.create(
      createTestRequest({ employeeId: anotherEmployeeId }),
    );

    const result = await sut.execute({
      tenantId,
      employeeId,
      page: 1,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should not include requests from other tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    await employeeRequestsRepository.create(createTestRequest());
    await employeeRequestsRepository.create(
      createTestRequest({ tenantId: otherTenantId }),
    );

    const result = await sut.execute({
      tenantId,
      employeeId,
      page: 1,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should paginate results correctly - first page', async () => {
    for (let i = 0; i < 5; i++) {
      await employeeRequestsRepository.create(createTestRequest());
    }

    const result = await sut.execute({
      tenantId,
      employeeId,
      page: 1,
      limit: 2,
    });

    expect(result.employeeRequests).toHaveLength(2);
    expect(result.total).toBe(5);
  });

  it('should paginate results correctly - second page', async () => {
    for (let i = 0; i < 5; i++) {
      await employeeRequestsRepository.create(createTestRequest());
    }

    const result = await sut.execute({
      tenantId,
      employeeId,
      page: 2,
      limit: 2,
    });

    expect(result.employeeRequests).toHaveLength(2);
    expect(result.total).toBe(5);
  });

  it('should paginate results correctly - last page with partial results', async () => {
    for (let i = 0; i < 5; i++) {
      await employeeRequestsRepository.create(createTestRequest());
    }

    const result = await sut.execute({
      tenantId,
      employeeId,
      page: 3,
      limit: 2,
    });

    expect(result.employeeRequests).toHaveLength(1);
    expect(result.total).toBe(5);
  });

  it('should return empty list when employee has no requests', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId,
      page: 1,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should return empty list for page beyond available data', async () => {
    await employeeRequestsRepository.create(createTestRequest());

    const result = await sut.execute({
      tenantId,
      employeeId,
      page: 10,
      limit: 20,
    });

    expect(result.employeeRequests).toHaveLength(0);
    expect(result.total).toBe(1);
  });
});
