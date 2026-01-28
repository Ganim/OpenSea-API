import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ItemReservation } from '@/entities/sales/item-reservation';
import { prisma } from '@/lib/prisma';
import type {
  CreateItemReservationSchema,
  ItemReservationsRepository,
} from '../item-reservations-repository';

export class PrismaItemReservationsRepository
  implements ItemReservationsRepository
{
  async create(data: CreateItemReservationSchema): Promise<ItemReservation> {
    const reservationData = await prisma.itemReservation.create({
      data: {
        itemId: data.itemId.toString(),
        userId: data.userId.toString(),
        quantity: data.quantity,
        reason: data.reason,
        reference: data.reference,
        expiresAt: data.expiresAt,
      },
    });

    return ItemReservation.create(
      {
        itemId: new EntityID(reservationData.itemId),
        userId: new EntityID(reservationData.userId),
        quantity: Number(reservationData.quantity),
        reason: reservationData.reason ?? undefined,
        reference: reservationData.reference ?? undefined,
        expiresAt: reservationData.expiresAt,
        releasedAt: reservationData.releasedAt ?? undefined,
        createdAt: reservationData.createdAt,
      },
      new EntityID(reservationData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<ItemReservation | null> {
    const reservationData = await prisma.itemReservation.findUnique({
      where: { id: id.toString() },
    });

    if (!reservationData) return null;

    return ItemReservation.create(
      {
        itemId: new EntityID(reservationData.itemId),
        userId: new EntityID(reservationData.userId),
        quantity: Number(reservationData.quantity),
        reason: reservationData.reason ?? undefined,
        reference: reservationData.reference ?? undefined,
        expiresAt: reservationData.expiresAt,
        releasedAt: reservationData.releasedAt ?? undefined,
        createdAt: reservationData.createdAt,
      },
      new EntityID(reservationData.id),
    );
  }

  async findManyByItem(itemId: UniqueEntityID): Promise<ItemReservation[]> {
    const reservationsData = await prisma.itemReservation.findMany({
      where: {
        itemId: itemId.toString(),
      },
      orderBy: { createdAt: 'desc' },
    });

    return reservationsData.map((reservationData) =>
      ItemReservation.create(
        {
          itemId: new EntityID(reservationData.itemId),
          userId: new EntityID(reservationData.userId),
          quantity: Number(reservationData.quantity),
          reason: reservationData.reason ?? undefined,
          reference: reservationData.reference ?? undefined,
          expiresAt: reservationData.expiresAt,
          releasedAt: reservationData.releasedAt ?? undefined,
          createdAt: reservationData.createdAt,
        },
        new EntityID(reservationData.id),
      ),
    );
  }

  async findManyByUser(userId: UniqueEntityID): Promise<ItemReservation[]> {
    const reservationsData = await prisma.itemReservation.findMany({
      where: {
        userId: userId.toString(),
      },
      orderBy: { createdAt: 'desc' },
    });

    return reservationsData.map((reservationData) =>
      ItemReservation.create(
        {
          itemId: new EntityID(reservationData.itemId),
          userId: new EntityID(reservationData.userId),
          quantity: Number(reservationData.quantity),
          reason: reservationData.reason ?? undefined,
          reference: reservationData.reference ?? undefined,
          expiresAt: reservationData.expiresAt,
          releasedAt: reservationData.releasedAt ?? undefined,
          createdAt: reservationData.createdAt,
        },
        new EntityID(reservationData.id),
      ),
    );
  }

  async findManyActive(itemId: UniqueEntityID): Promise<ItemReservation[]> {
    const now = new Date();
    const reservationsData = await prisma.itemReservation.findMany({
      where: {
        itemId: itemId.toString(),
        releasedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reservationsData.map((reservationData) =>
      ItemReservation.create(
        {
          itemId: new EntityID(reservationData.itemId),
          userId: new EntityID(reservationData.userId),
          quantity: Number(reservationData.quantity),
          reason: reservationData.reason ?? undefined,
          reference: reservationData.reference ?? undefined,
          expiresAt: reservationData.expiresAt,
          releasedAt: reservationData.releasedAt ?? undefined,
          createdAt: reservationData.createdAt,
        },
        new EntityID(reservationData.id),
      ),
    );
  }

  async findManyExpired(): Promise<ItemReservation[]> {
    const now = new Date();
    const reservationsData = await prisma.itemReservation.findMany({
      where: {
        releasedAt: null,
        expiresAt: {
          lte: now,
        },
      },
      orderBy: { expiresAt: 'asc' },
    });

    return reservationsData.map((reservationData) =>
      ItemReservation.create(
        {
          itemId: new EntityID(reservationData.itemId),
          userId: new EntityID(reservationData.userId),
          quantity: Number(reservationData.quantity),
          reason: reservationData.reason ?? undefined,
          reference: reservationData.reference ?? undefined,
          expiresAt: reservationData.expiresAt,
          releasedAt: reservationData.releasedAt ?? undefined,
          createdAt: reservationData.createdAt,
        },
        new EntityID(reservationData.id),
      ),
    );
  }

  async save(reservation: ItemReservation): Promise<void> {
    await prisma.itemReservation.upsert({
      where: { id: reservation.id.toString() },
      create: {
        id: reservation.id.toString(),
        itemId: reservation.itemId.toString(),
        userId: reservation.userId.toString(),
        quantity: reservation.quantity,
        reason: reservation.reason,
        reference: reservation.reference,
        expiresAt: reservation.expiresAt,
        releasedAt: reservation.releasedAt,
        createdAt: reservation.createdAt,
      },
      update: {
        releasedAt: reservation.releasedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.itemReservation.update({
      where: { id: id.toString() },
      data: {
        releasedAt: new Date(),
      },
    });
  }
}
