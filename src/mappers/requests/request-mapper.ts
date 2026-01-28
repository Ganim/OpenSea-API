import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Request } from '@/entities/requests/request';
import type { RequestPriority } from '@/entities/requests/value-objects/request-priority';
import type { RequestStatus } from '@/entities/requests/value-objects/request-status';
import type { RequestTargetType } from '@/entities/requests/value-objects/request-target-type';
import type { RequestType } from '@/entities/requests/value-objects/request-type';
import type {
  Prisma,
  Request as PrismaRequest,
} from '@prisma/generated/client.js';

export class RequestMapper {
  static toDomain(raw: PrismaRequest): Request {
    return Request.create(
      {
        title: raw.title,
        description: raw.description,
        type: raw.type as RequestType,
        category: raw.category ?? undefined,
        status: raw.status as RequestStatus,
        priority: raw.priority as RequestPriority,
        requesterId: new UniqueEntityID(raw.requesterId),
        targetType: raw.targetType as RequestTargetType,
        targetId: raw.targetId ?? undefined,
        assignedToId: raw.assignedToId
          ? new UniqueEntityID(raw.assignedToId)
          : undefined,
        dueDate: raw.dueDate ?? undefined,
        slaDeadline: raw.slaDeadline ?? undefined,
        metadata: (raw.metadata as Record<string, unknown>) ?? {},
        requiresApproval: raw.requiresApproval,
        approvalId: raw.approvalId ?? undefined,
        submittedAt: raw.submittedAt ?? undefined,
        completedAt: raw.completedAt ?? undefined,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt ?? undefined,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(request: Request): Prisma.RequestUncheckedCreateInput {
    return {
      id: request.id.toString(),
      title: request.title,
      description: request.description,
      type: request.type,
      category: request.category,
      status: request.status,
      priority: request.priority,
      requesterId: request.requesterId.toString(),
      targetType: request.targetType,
      targetId: request.targetId,
      assignedToId: request.assignedToId?.toString(),
      dueDate: request.dueDate,
      slaDeadline: request.slaDeadline,
      metadata: request.metadata as Prisma.InputJsonValue,
      requiresApproval: request.requiresApproval,
      approvalId: request.approvalId,
      submittedAt: request.submittedAt,
      completedAt: request.completedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      deletedAt: request.deletedAt,
    };
  }
}
