import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import { prisma } from '@/lib/prisma';
import { mapOffboardingChecklistPrismaToDomain } from '@/mappers/hr/offboarding-checklist';
import type {
  FindManyOffboardingChecklistsParams,
  FindManyOffboardingChecklistsResult,
  OffboardingChecklistsRepository,
} from '../offboarding-checklists-repository';

export class PrismaOffboardingChecklistsRepository
  implements OffboardingChecklistsRepository
{
  async create(checklist: OffboardingChecklist): Promise<void> {
    await prisma.offboardingChecklist.create({
      data: {
        id: checklist.id.toString(),
        tenantId: checklist.tenantId.toString(),
        employeeId: checklist.employeeId.toString(),
        terminationId: checklist.terminationId?.toString() ?? null,
        title: checklist.title,
        items: checklist.items as unknown as object,
        progress: checklist.progress,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OffboardingChecklist | null> {
    const raw = await prisma.offboardingChecklist.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!raw) return null;

    const domainProps = mapOffboardingChecklistPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
    return OffboardingChecklist.create(domainProps, new UniqueEntityID(raw.id));
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<OffboardingChecklist | null> {
    const raw = await prisma.offboardingChecklist.findFirst({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!raw) return null;

    const domainProps = mapOffboardingChecklistPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
    return OffboardingChecklist.create(domainProps, new UniqueEntityID(raw.id));
  }

  async findMany(
    params: FindManyOffboardingChecklistsParams,
  ): Promise<FindManyOffboardingChecklistsResult> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.employeeId) {
      where.employeeId = params.employeeId;
    }

    if (params.status === 'COMPLETED') {
      where.progress = 100;
    } else if (params.status === 'IN_PROGRESS') {
      where.progress = { lt: 100 };
    }

    if (params.search) {
      where.title = { contains: params.search, mode: 'insensitive' };
    }

    const [rawChecklists, total] = await Promise.all([
      prisma.offboardingChecklist.findMany({
        where,
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.offboardingChecklist.count({ where }),
    ]);

    const checklists = rawChecklists.map((raw) => {
      const domainProps = mapOffboardingChecklistPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      return OffboardingChecklist.create(
        domainProps,
        new UniqueEntityID(raw.id),
      );
    });

    return { checklists, total };
  }

  async save(checklist: OffboardingChecklist): Promise<void> {
    await prisma.offboardingChecklist.update({
      where: {
        id: checklist.id.toString(),
        tenantId: checklist.tenantId.toString(),
      },
      data: {
        title: checklist.title,
        items: checklist.items as unknown as object,
        progress: checklist.progress,
        deletedAt: checklist.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.offboardingChecklist.update({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
      data: { deletedAt: new Date() },
    });
  }
}
