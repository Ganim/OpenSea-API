import type { PosCashMovement } from '@/entities/sales/pos-cash-movement';
import { prisma } from '@/lib/prisma';
import { posCashMovementPrismaToDomain } from '@/mappers/sales/pos-cash-movement/pos-cash-movement-prisma-to-domain';
import type { PosCashMovementsRepository } from '../pos-cash-movements-repository';
import type { PosCashMovementType as PrismaType } from '@prisma/generated/client.js';

export class PrismaPosCashMovementsRepository
  implements PosCashMovementsRepository
{
  async create(movement: PosCashMovement): Promise<void> {
    await prisma.posCashMovement.create({
      data: {
        id: movement.id.toString(),
        tenantId: movement.tenantId.toString(),
        sessionId: movement.sessionId.toString(),
        type: movement.type as PrismaType,
        amount: movement.amount,
        reason: movement.reason ?? null,
        performedByUserId: movement.performedByUserId.toString(),
        authorizedByUserId: movement.authorizedByUserId?.toString() ?? null,
      },
    });
  }

  async findBySessionId(sessionId: string): Promise<PosCashMovement[]> {
    const data = await prisma.posCashMovement.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return data.map(posCashMovementPrismaToDomain);
  }
}
