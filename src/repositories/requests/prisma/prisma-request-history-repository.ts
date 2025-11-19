import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { RequestHistory } from '@/entities/requests/request-history';
import { prisma } from '@/lib/prisma';
import { RequestHistoryMapper } from '@/mappers/requests/request-history-mapper';
import type { RequestHistoryRepository } from '../request-history-repository';

export class PrismaRequestHistoryRepository
  implements RequestHistoryRepository
{
  async create(history: RequestHistory): Promise<void> {
    const data = RequestHistoryMapper.toPrisma(history);
    await prisma.requestHistory.create({ data });
  }

  async findManyByRequestId(
    requestId: UniqueEntityID,
  ): Promise<RequestHistory[]> {
    const history = await prisma.requestHistory.findMany({
      where: { requestId: requestId.toString() },
      orderBy: { createdAt: 'desc' },
    });

    return history.map(RequestHistoryMapper.toDomain);
  }
}
