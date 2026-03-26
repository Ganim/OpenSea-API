import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Form } from '@/entities/sales/form';
import { prisma } from '@/lib/prisma';
import type { FormStatus } from '@prisma/generated/client.js';
import type {
  CreateFormSchema,
  FormsRepository,
} from '../forms-repository';

function mapToDomain(data: Record<string, unknown>): Form {
  return Form.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      title: data.title as string,
      description: (data.description as string) ?? undefined,
      status: data.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
      submissionCount: data.submissionCount as number,
      createdBy: data.createdBy as string,
      isActive: data.isActive as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaFormsRepository implements FormsRepository {
  async create(data: CreateFormSchema): Promise<Form> {
    const formData = await prisma.form.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        description: data.description,
        createdBy: data.createdBy,
        status: (data.status ?? 'DRAFT') as FormStatus,
      },
    });

    return mapToDomain(formData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Form | null> {
    const formData = await prisma.form.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!formData) return null;

    return mapToDomain(formData as unknown as Record<string, unknown>);
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<Form[]> {
    const formsData = await prisma.form.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status: status as FormStatus }),
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return formsData.map((formData) =>
      mapToDomain(formData as unknown as Record<string, unknown>),
    );
  }

  async countByTenant(tenantId: string, status?: string): Promise<number> {
    return prisma.form.count({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status: status as FormStatus }),
      },
    });
  }

  async save(form: Form): Promise<void> {
    await prisma.form.update({
      where: { id: form.id.toString() },
      data: {
        title: form.title,
        description: form.description,
        status: form.status as FormStatus,
        submissionCount: form.submissionCount,
        isActive: form.isActive,
        deletedAt: form.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.form.update({
      where: { id: id.toString(), tenantId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
