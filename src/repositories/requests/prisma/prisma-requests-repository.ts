import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Request } from '@/entities/requests/request';
import { prisma } from '@/lib/prisma';
import { RequestMapper } from '@/mappers/requests/request-mapper';
import type {
  FindManyRequestsParams,
  RequestsRepository,
} from '../requests-repository';

export class PrismaRequestsRepository implements RequestsRepository {
  async create(request: Request): Promise<void> {
    const data = RequestMapper.toPrisma(request);
    await prisma.request.create({ data });
  }

  async save(request: Request): Promise<void> {
    const data = RequestMapper.toPrisma(request);
    await prisma.request.update({
      where: { id: request.id.toString() },
      data,
    });
  }

  async findById(id: UniqueEntityID): Promise<Request | null> {
    const request = await prisma.request.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!request) {
      return null;
    }

    return RequestMapper.toDomain(request);
  }

  async findMany(params: FindManyRequestsParams): Promise<Request[]> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const requests = await prisma.request.findMany({
      where: {
        requesterId: params.requesterId,
        assignedToId: params.assignedToId,
        status: params.status,
        type: params.type,
        category: params.category,
        deletedAt: null,
      },
      orderBy: [
        {
          priority: 'desc', // URGENT > HIGH > MEDIUM > LOW
        },
        {
          createdAt: 'desc',
        },
      ],
      skip,
      take: limit,
    });

    return requests.map(RequestMapper.toDomain);
  }

  async countMany(
    params: Omit<FindManyRequestsParams, 'page' | 'limit'>,
  ): Promise<number> {
    return prisma.request.count({
      where: {
        requesterId: params.requesterId,
        assignedToId: params.assignedToId,
        status: params.status,
        type: params.type,
        category: params.category,
        deletedAt: null,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.request.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
