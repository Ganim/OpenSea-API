import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { FormSubmission } from '@/entities/sales/form-submission';
import { prisma } from '@/lib/prisma';
import type {
  CreateFormSubmissionSchema,
  FormSubmissionsRepository,
} from '../form-submissions-repository';

function mapToDomain(data: Record<string, unknown>): FormSubmission {
  return FormSubmission.create(
    {
      formId: new EntityID(data.formId as string),
      data: data.data as Record<string, unknown>,
      submittedBy: (data.submittedBy as string) ?? undefined,
      createdAt: data.createdAt as Date,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaFormSubmissionsRepository
  implements FormSubmissionsRepository
{
  async create(data: CreateFormSubmissionSchema): Promise<FormSubmission> {
    const submissionData = await prisma.formSubmission.create({
      data: {
        formId: data.formId,
        data: data.data,
        submittedBy: data.submittedBy,
      },
    });

    return mapToDomain(submissionData as unknown as Record<string, unknown>);
  }

  async findByFormId(
    formId: UniqueEntityID,
    page: number,
    perPage: number,
  ): Promise<FormSubmission[]> {
    const submissionsData = await prisma.formSubmission.findMany({
      where: { formId: formId.toString() },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return submissionsData.map((submissionData) =>
      mapToDomain(submissionData as unknown as Record<string, unknown>),
    );
  }

  async countByFormId(formId: UniqueEntityID): Promise<number> {
    return prisma.formSubmission.count({
      where: { formId: formId.toString() },
    });
  }
}
