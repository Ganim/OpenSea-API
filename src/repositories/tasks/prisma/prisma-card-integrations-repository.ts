import { prisma } from '@/lib/prisma';
import type {
  CardIntegrationRecord,
  CardIntegrationsRepository,
  CreateCardIntegrationData,
} from '../card-integrations-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): CardIntegrationRecord {
  return {
    id: raw.id,
    cardId: raw.cardId,
    type: raw.type,
    entityId: raw.entityId,
    entityLabel: raw.entityLabel,
    createdBy: raw.createdBy,
    createdAt: raw.createdAt,
  };
}

export class PrismaCardIntegrationsRepository
  implements CardIntegrationsRepository
{
  async create(
    data: CreateCardIntegrationData,
  ): Promise<CardIntegrationRecord> {
    const raw = await prisma.cardIntegration.create({
      data: {
        cardId: data.cardId,
        type: data.type as never,
        entityId: data.entityId,
        entityLabel: data.entityLabel,
        createdBy: data.createdBy,
      },
    });

    return toRecord(raw);
  }

  async delete(id: string): Promise<void> {
    await prisma.cardIntegration.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<CardIntegrationRecord | null> {
    const raw = await prisma.cardIntegration.findUnique({
      where: { id },
    });

    return raw ? toRecord(raw) : null;
  }

  async findByCardId(cardId: string): Promise<CardIntegrationRecord[]> {
    const rows = await prisma.cardIntegration.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(toRecord);
  }

  async findByCardAndEntity(
    cardId: string,
    type: string,
    entityId: string,
  ): Promise<CardIntegrationRecord | null> {
    const raw = await prisma.cardIntegration.findUnique({
      where: {
        cardId_type_entityId: { cardId, type: type as never, entityId },
      },
    });

    return raw ? toRecord(raw) : null;
  }
}
