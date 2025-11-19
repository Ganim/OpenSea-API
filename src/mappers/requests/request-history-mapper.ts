import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RequestHistory } from '@/entities/requests/request-history';
import type {
  Prisma,
  RequestHistory as PrismaRequestHistory,
} from '@prisma/client';

export class RequestHistoryMapper {
  static toDomain(raw: PrismaRequestHistory): RequestHistory {
    return RequestHistory.create(
      {
        requestId: new UniqueEntityID(raw.requestId),
        action: raw.action,
        description: raw.description,
        performedById: new UniqueEntityID(raw.performedById),
        oldValue: (raw.oldValue as Record<string, unknown>) ?? undefined,
        newValue: (raw.newValue as Record<string, unknown>) ?? undefined,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(
    history: RequestHistory,
  ): Prisma.RequestHistoryUncheckedCreateInput {
    return {
      id: history.id.toString(),
      requestId: history.requestId.toString(),
      action: history.action,
      description: history.description,
      performedById: history.performedById.toString(),
      oldValue: history.oldValue as Prisma.InputJsonValue,
      newValue: history.newValue as Prisma.InputJsonValue,
      createdAt: history.createdAt,
    };
  }
}
