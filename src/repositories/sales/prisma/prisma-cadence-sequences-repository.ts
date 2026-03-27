import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import {
  CadenceSequence,
  type CadenceEnrollmentProps,
  type CadenceEnrollmentStatus,
  type CadenceStepType,
} from '@/entities/sales/cadence-sequence';
import { prisma } from '@/lib/prisma';
import type {
  CadenceEnrollmentStatus as PrismaEnrollmentStatus,
  CadenceStepType as PrismaStepType,
} from '@prisma/generated/client.js';
import type {
  CadenceSequencesRepository,
  CreateCadenceEnrollmentSchema,
  CreateCadenceSequenceSchema,
} from '../cadence-sequences-repository';

function mapSequenceToDomain(
  sequenceData: Record<string, unknown>,
  stepsData: Record<string, unknown>[],
  enrollmentCount?: number,
): CadenceSequence {
  return CadenceSequence.create(
    {
      tenantId: new EntityID(sequenceData.tenantId as string),
      name: sequenceData.name as string,
      description: (sequenceData.description as string) ?? undefined,
      isActive: sequenceData.isActive as boolean,
      createdBy: sequenceData.createdBy as string,
      createdAt: sequenceData.createdAt as Date,
      updatedAt: sequenceData.updatedAt as Date,
      deletedAt: (sequenceData.deletedAt as Date) ?? undefined,
      enrollmentCount,
      steps: stepsData.map((step) => ({
        id: new EntityID(step.id as string),
        sequenceId: new EntityID(step.sequenceId as string),
        order: step.order as number,
        type: step.type as CadenceStepType,
        delayDays: step.delayDays as number,
        config: (step.config as Record<string, unknown>) ?? {},
        createdAt: step.createdAt as Date,
        updatedAt: (step.updatedAt as Date) ?? undefined,
      })),
    },
    new EntityID(sequenceData.id as string),
  );
}

function mapEnrollmentToDomain(
  enrollmentData: Record<string, unknown>,
): CadenceEnrollmentProps {
  return {
    id: new EntityID(enrollmentData.id as string),
    sequenceId: new EntityID(enrollmentData.sequenceId as string),
    tenantId: new EntityID(enrollmentData.tenantId as string),
    contactId: (enrollmentData.contactId as string) ?? undefined,
    dealId: (enrollmentData.dealId as string) ?? undefined,
    currentStepOrder: enrollmentData.currentStepOrder as number,
    status: enrollmentData.status as CadenceEnrollmentStatus,
    nextActionAt: (enrollmentData.nextActionAt as Date) ?? undefined,
    startedAt: enrollmentData.startedAt as Date,
    completedAt: (enrollmentData.completedAt as Date) ?? undefined,
    createdAt: enrollmentData.createdAt as Date,
  };
}

export class PrismaCadenceSequencesRepository
  implements CadenceSequencesRepository
{
  async create(data: CreateCadenceSequenceSchema): Promise<CadenceSequence> {
    const sequenceData = await prisma.cadenceSequence.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        steps: {
          create: data.steps.map((stepInput) => ({
            order: stepInput.order,
            type: stepInput.type as PrismaStepType,
            delayDays: stepInput.delayDays,
            config: stepInput.config,
          })),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    return mapSequenceToDomain(
      sequenceData as unknown as Record<string, unknown>,
      sequenceData.steps as unknown as Record<string, unknown>[],
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CadenceSequence | null> {
    const sequenceData = await prisma.cadenceSequence.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        steps: { orderBy: { order: 'asc' } },
        _count: { select: { enrollments: true } },
      },
    });

    if (!sequenceData) return null;

    return mapSequenceToDomain(
      sequenceData as unknown as Record<string, unknown>,
      sequenceData.steps as unknown as Record<string, unknown>[],
      sequenceData._count.enrollments,
    );
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { isActive?: boolean; search?: string },
  ): Promise<CadenceSequence[]> {
    const sequencesData = await prisma.cadenceSequence.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filters?.isActive !== undefined && {
          isActive: filters.isActive,
        }),
        ...(filters?.search && {
          name: { contains: filters.search, mode: 'insensitive' as const },
        }),
      },
      include: { steps: { orderBy: { order: 'asc' } } },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return sequencesData.map((sequenceData) =>
      mapSequenceToDomain(
        sequenceData as unknown as Record<string, unknown>,
        sequenceData.steps as unknown as Record<string, unknown>[],
      ),
    );
  }

  async countMany(
    tenantId: string,
    filters?: { isActive?: boolean; search?: string },
  ): Promise<number> {
    return prisma.cadenceSequence.count({
      where: {
        tenantId,
        deletedAt: null,
        ...(filters?.isActive !== undefined && {
          isActive: filters.isActive,
        }),
        ...(filters?.search && {
          name: { contains: filters.search, mode: 'insensitive' as const },
        }),
      },
    });
  }

  async save(cadenceSequence: CadenceSequence): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.cadenceSequence.update({
        where: { id: cadenceSequence.id.toString() },
        data: {
          name: cadenceSequence.name,
          description: cadenceSequence.description ?? null,
          isActive: cadenceSequence.isActive,
          deletedAt: cadenceSequence.deletedAt ?? null,
        },
      });

      // Replace all steps
      await tx.cadenceStep.deleteMany({
        where: { sequenceId: cadenceSequence.id.toString() },
      });

      if (cadenceSequence.steps.length > 0) {
        await tx.cadenceStep.createMany({
          data: cadenceSequence.steps.map((step) => ({
            id: step.id.toString(),
            sequenceId: cadenceSequence.id.toString(),
            order: step.order,
            type: step.type as PrismaStepType,
            delayDays: step.delayDays,
            config: step.config,
          })),
        });
      }
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.cadenceSequence.update({
      where: {
        id: id.toString(),
        tenantId,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async createEnrollment(
    data: CreateCadenceEnrollmentSchema,
  ): Promise<CadenceEnrollmentProps> {
    const enrollmentData = await prisma.cadenceEnrollment.create({
      data: {
        sequenceId: data.sequenceId,
        tenantId: data.tenantId,
        contactId: data.contactId,
        dealId: data.dealId,
        currentStepOrder: data.currentStepOrder,
        status: data.status as PrismaEnrollmentStatus,
        nextActionAt: data.nextActionAt,
      },
    });

    return mapEnrollmentToDomain(
      enrollmentData as unknown as Record<string, unknown>,
    );
  }

  async findEnrollmentById(
    id: string,
    tenantId: string,
  ): Promise<CadenceEnrollmentProps | null> {
    const enrollmentData = await prisma.cadenceEnrollment.findFirst({
      where: { id, tenantId },
    });

    if (!enrollmentData) return null;

    return mapEnrollmentToDomain(
      enrollmentData as unknown as Record<string, unknown>,
    );
  }

  async saveEnrollment(enrollment: CadenceEnrollmentProps): Promise<void> {
    await prisma.cadenceEnrollment.update({
      where: { id: enrollment.id.toString() },
      data: {
        currentStepOrder: enrollment.currentStepOrder,
        status: enrollment.status as PrismaEnrollmentStatus,
        nextActionAt: enrollment.nextActionAt ?? null,
        completedAt: enrollment.completedAt ?? null,
      },
    });
  }

  async findPendingEnrollments(
    tenantId: string,
    now: Date,
  ): Promise<CadenceEnrollmentProps[]> {
    const enrollmentsData = await prisma.cadenceEnrollment.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        nextActionAt: { lte: now },
      },
    });

    return enrollmentsData.map((enrollmentData) =>
      mapEnrollmentToDomain(
        enrollmentData as unknown as Record<string, unknown>,
      ),
    );
  }
}
