import {
  centralUserPrismaToDomain,
  centralUserToPrisma,
} from '@/mappers/core/central-user-mapper';
import { prisma } from '@/lib/prisma';
import type { CentralUser } from '@/entities/core/central-user';
import type { CentralUsersRepository } from '../central-users-repository';

export class PrismaCentralUsersRepository implements CentralUsersRepository {
  async findByUserId(userId: string): Promise<CentralUser | null> {
    const centralUserDb = await prisma.centralUser.findUnique({
      where: { userId },
    });
    if (!centralUserDb) return null;

    return centralUserPrismaToDomain(centralUserDb);
  }

  async findAll(): Promise<CentralUser[]> {
    const centralUsersDb = await prisma.centralUser.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return centralUsersDb.map(centralUserPrismaToDomain);
  }

  async findByRole(role: string): Promise<CentralUser[]> {
    const centralUsersDb = await prisma.centralUser.findMany({
      where: { role: role as never },
      orderBy: { createdAt: 'desc' },
    });

    return centralUsersDb.map(centralUserPrismaToDomain);
  }

  async create(entity: CentralUser): Promise<void> {
    const prismaData = centralUserToPrisma(entity);

    await prisma.centralUser.create({
      data: prismaData,
    });
  }

  async save(entity: CentralUser): Promise<void> {
    const prismaData = centralUserToPrisma(entity);

    await prisma.centralUser.update({
      where: { id: prismaData.id },
      data: prismaData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.centralUser.delete({
      where: { id },
    });
  }
}
