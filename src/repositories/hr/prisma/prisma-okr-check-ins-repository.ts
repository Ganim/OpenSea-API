import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OKRCheckIn } from '@/entities/hr/okr-check-in';
import { prisma } from '@/lib/prisma';
import { mapOKRCheckInPrismaToDomain } from '@/mappers/hr/okr-check-in';
import type {
  CreateOKRCheckInSchema,
  OKRCheckInsRepository,
} from '../okr-check-ins-repository';

export class PrismaOKRCheckInsRepository implements OKRCheckInsRepository {
  async create(data: CreateOKRCheckInSchema): Promise<OKRCheckIn> {
    const checkInData = await prisma.oKRCheckIn.create({
      data: {
        tenantId: data.tenantId,
        keyResultId: data.keyResultId.toString(),
        employeeId: data.employeeId.toString(),
        previousValue: data.previousValue,
        newValue: data.newValue,
        note: data.note,
        confidence: data.confidence,
      },
    });

    return OKRCheckIn.create(
      mapOKRCheckInPrismaToDomain(checkInData),
      new UniqueEntityID(checkInData.id),
    );
  }

  async findByKeyResult(
    keyResultId: UniqueEntityID,
    tenantId: string,
  ): Promise<OKRCheckIn[]> {
    const checkInsData = await prisma.oKRCheckIn.findMany({
      where: { keyResultId: keyResultId.toString(), tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return checkInsData.map((c) =>
      OKRCheckIn.create(
        mapOKRCheckInPrismaToDomain(c),
        new UniqueEntityID(c.id),
      ),
    );
  }
}
