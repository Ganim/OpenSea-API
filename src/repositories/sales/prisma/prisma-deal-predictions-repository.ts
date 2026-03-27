import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { DealPrediction } from '@/entities/sales/deal-prediction';
import type { PredictionFactor } from '@/entities/sales/deal-prediction';
import { prisma } from '@/lib/prisma';
import type { DealPredictionsRepository } from '../deal-predictions-repository';

function mapToDomain(data: Record<string, unknown>): DealPrediction {
  return DealPrediction.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      dealId: new EntityID(data.dealId as string),
      probability: data.probability as number,
      estimatedCloseDate: (data.estimatedCloseDate as Date) ?? undefined,
      confidence: data.confidence as 'LOW' | 'MEDIUM' | 'HIGH',
      factors: (data.factors as PredictionFactor[]) ?? [],
      modelVersion: data.modelVersion as string,
      createdAt: data.createdAt as Date,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaDealPredictionsRepository
  implements DealPredictionsRepository
{
  async create(prediction: DealPrediction): Promise<void> {
    await prisma.dealPrediction.create({
      data: {
        id: prediction.id.toString(),
        tenantId: prediction.tenantId.toString(),
        dealId: prediction.dealId.toString(),
        probability: prediction.probability,
        estimatedCloseDate: prediction.estimatedCloseDate,
        confidence: prediction.confidence,
        factors: prediction.factors as unknown as Record<string, unknown>[],
        modelVersion: prediction.modelVersion,
      },
    });
  }

  async findLatestByDealId(
    dealId: UniqueEntityID,
    tenantId: string,
  ): Promise<DealPrediction | null> {
    const predictionData = await prisma.dealPrediction.findFirst({
      where: {
        dealId: dealId.toString(),
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!predictionData) return null;
    return mapToDomain(predictionData as unknown as Record<string, unknown>);
  }

  async findManyByTenantId(tenantId: string): Promise<DealPrediction[]> {
    const predictionsData = await prisma.dealPrediction.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return predictionsData.map((predictionData) =>
      mapToDomain(predictionData as unknown as Record<string, unknown>),
    );
  }
}
