import { prisma } from '@/lib/prisma';
import type {
  AiWorkflowExecutionsRepository,
  CreateExecutionSchema,
  UpdateExecutionSchema,
  FindManyExecutionsOptions,
  FindManyExecutionsResult,
  WorkflowExecutionRecord,
} from '../ai-workflow-executions-repository';
import type {
  AiWorkflowExecutionStatus,
  Prisma,
} from '@prisma/generated/client.js';

function toRecord(raw: {
  id: string;
  workflowId: string;
  status: string;
  trigger: string;
  results: unknown;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
}): WorkflowExecutionRecord {
  return {
    id: raw.id,
    workflowId: raw.workflowId,
    status: raw.status,
    trigger: raw.trigger,
    results: raw.results,
    error: raw.error,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
  };
}

export class PrismaAiWorkflowExecutionsRepository
  implements AiWorkflowExecutionsRepository
{
  async create(data: CreateExecutionSchema): Promise<WorkflowExecutionRecord> {
    const raw = await prisma.aiWorkflowExecution.create({
      data: {
        workflowId: data.workflowId,
        trigger: data.trigger,
      },
    });

    return toRecord(raw);
  }

  async update(
    id: string,
    data: UpdateExecutionSchema,
  ): Promise<WorkflowExecutionRecord> {
    const updateData: Prisma.AiWorkflowExecutionUpdateInput = {
      status: data.status as AiWorkflowExecutionStatus,
    };

    if (data.results !== undefined) {
      updateData.results = data.results as Prisma.InputJsonValue;
    }
    if (data.error !== undefined) {
      updateData.error = data.error;
    }
    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt;
    }

    const raw = await prisma.aiWorkflowExecution.update({
      where: { id },
      data: updateData,
    });

    return toRecord(raw);
  }

  async findMany(
    options: FindManyExecutionsOptions,
  ): Promise<FindManyExecutionsResult> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AiWorkflowExecutionWhereInput = {
      workflowId: options.workflowId,
    };

    const [executions, total] = await Promise.all([
      prisma.aiWorkflowExecution.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aiWorkflowExecution.count({ where }),
    ]);

    return {
      executions: executions.map(toRecord),
      total,
    };
  }
}
