import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import { prisma } from '@/lib/prisma';
import { mapOnboardingChecklistPrismaToDomain } from '@/mappers/hr/onboarding-checklist';
import type { OnboardingChecklistsRepository } from '../onboarding-checklists-repository';

export class PrismaOnboardingChecklistsRepository
  implements OnboardingChecklistsRepository
{
  async create(checklist: OnboardingChecklist): Promise<void> {
    await prisma.onboardingChecklist.create({
      data: {
        id: checklist.id.toString(),
        tenantId: checklist.tenantId.toString(),
        employeeId: checklist.employeeId.toString(),
        items: checklist.items as unknown as object,
        progress: checklist.progress,
      },
    });
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<OnboardingChecklist | null> {
    const raw = await prisma.onboardingChecklist.findFirst({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
      },
    });

    if (!raw) return null;

    const domainProps = mapOnboardingChecklistPrismaToDomain(
      raw as unknown as Record<string, unknown>,
    );
    return OnboardingChecklist.create(domainProps, new UniqueEntityID(raw.id));
  }

  async save(checklist: OnboardingChecklist): Promise<void> {
    await prisma.onboardingChecklist.update({
      where: { id: checklist.id.toString() },
      data: {
        items: checklist.items as unknown as object,
        progress: checklist.progress,
      },
    });
  }
}
