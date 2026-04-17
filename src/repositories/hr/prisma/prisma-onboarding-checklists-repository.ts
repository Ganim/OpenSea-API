import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import { prisma } from '@/lib/prisma';
import { mapOnboardingChecklistPrismaToDomain } from '@/mappers/hr/onboarding-checklist';
import type {
  FindManyOnboardingChecklistsParams,
  FindManyOnboardingChecklistsResult,
  OnboardingChecklistsRepository,
} from '../onboarding-checklists-repository';

export class PrismaOnboardingChecklistsRepository
  implements OnboardingChecklistsRepository
{
  async create(checklist: OnboardingChecklist): Promise<void> {
    await prisma.onboardingChecklist.create({
      data: {
        id: checklist.id.toString(),
        tenantId: checklist.tenantId.toString(),
        employeeId: checklist.employeeId.toString(),
        title: checklist.title,
        items: checklist.items as unknown as object,
        progress: checklist.progress,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OnboardingChecklist | null> {
    const raw = await prisma.onboardingChecklist.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!raw) return null;

    const domainProps = mapOnboardingChecklistPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
    return OnboardingChecklist.create(domainProps, new UniqueEntityID(raw.id));
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<OnboardingChecklist | null> {
    const raw = await prisma.onboardingChecklist.findFirst({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!raw) return null;

    const domainProps = mapOnboardingChecklistPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
    return OnboardingChecklist.create(domainProps, new UniqueEntityID(raw.id));
  }

  async findMany(
    params: FindManyOnboardingChecklistsParams,
  ): Promise<FindManyOnboardingChecklistsResult> {
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
      prisma.onboardingChecklist.findMany({
        where,
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.onboardingChecklist.count({ where }),
    ]);

    const checklists = rawChecklists.map((raw) => {
      const domainProps = mapOnboardingChecklistPrismaToDomain(
        raw as unknown as Record<string, unknown>,
      );
      return OnboardingChecklist.create(
        domainProps,
        new UniqueEntityID(raw.id),
      );
    });

    return { checklists, total };
  }

  async save(checklist: OnboardingChecklist): Promise<void> {
    await prisma.onboardingChecklist.update({
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
    await prisma.onboardingChecklist.update({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
      data: { deletedAt: new Date() },
    });
  }
}
