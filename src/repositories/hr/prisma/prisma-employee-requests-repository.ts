import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeRequest } from '@/entities/hr/employee-request';
import { prisma } from '@/lib/prisma';
import { mapEmployeeRequestPrismaToDomain } from '@/mappers/hr/employee-request';
import type {
  EmployeeRequestsRepository,
  PaginatedEmployeeRequestsResult,
} from '../employee-requests-repository';

export class PrismaEmployeeRequestsRepository
  implements EmployeeRequestsRepository
{
  async create(request: EmployeeRequest): Promise<void> {
    await prisma.employeeRequest.create({
      data: {
        id: request.id.toString(),
        tenantId: request.tenantId.toString(),
        employeeId: request.employeeId.toString(),
        type: request.type,
        status: request.status,
        data: request.data,
        approverEmployeeId: request.approverEmployeeId?.toString(),
        approvedAt: request.approvedAt,
        rejectionReason: request.rejectionReason,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EmployeeRequest | null> {
    const raw = await prisma.employeeRequest.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!raw) return null;

    const domainProps = mapEmployeeRequestPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
    return EmployeeRequest.create(domainProps, new UniqueEntityID(raw.id));
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeeRequestsResult> {
    const where = {
      tenantId,
      employeeId: employeeId.toString(),
    };

    const [rawItems, total] = await Promise.all([
      prisma.employeeRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employeeRequest.count({ where }),
    ]);

    const employeeRequests = rawItems.map((raw) => {
      const domainProps = mapEmployeeRequestPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      return EmployeeRequest.create(domainProps, new UniqueEntityID(raw.id));
    });

    return { employeeRequests, total };
  }

  async findManyPendingByApprover(
    _approverEmployeeIds: string[],
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeeRequestsResult> {
    const where = {
      tenantId,
      status: 'PENDING',
    };

    const [rawItems, total] = await Promise.all([
      prisma.employeeRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employeeRequest.count({ where }),
    ]);

    const employeeRequests = rawItems.map((raw) => {
      const domainProps = mapEmployeeRequestPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      return EmployeeRequest.create(domainProps, new UniqueEntityID(raw.id));
    });

    return { employeeRequests, total };
  }

  async save(request: EmployeeRequest): Promise<void> {
    await prisma.employeeRequest.update({
      where: { id: request.id.toString() },
      data: {
        status: request.status,
        approverEmployeeId: request.approverEmployeeId?.toString(),
        approvedAt: request.approvedAt,
        rejectionReason: request.rejectionReason,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.employeeRequest.delete({
      where: { id: id.toString() },
    });
  }
}
