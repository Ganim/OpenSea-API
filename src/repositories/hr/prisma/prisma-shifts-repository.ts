import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Shift } from '@/entities/hr/shift';
import { prisma } from '@/lib/prisma';
import { mapShiftPrismaToDomain } from '@/mappers/hr/shift';
import type {
  CreateShiftSchema,
  ShiftsRepository,
  UpdateShiftSchema,
} from '../shifts-repository';

export class PrismaShiftsRepository implements ShiftsRepository {
  async create(data: CreateShiftSchema): Promise<Shift> {
    const shiftData = await prisma.shift.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        code: data.code,
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes,
        isNightShift: data.isNightShift ?? false,
        color: data.color,
        isActive: data.isActive ?? true,
      },
    });

    return Shift.create(
      mapShiftPrismaToDomain(shiftData),
      new UniqueEntityID(shiftData.id),
    );
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Shift | null> {
    const shiftData = await prisma.shift.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!shiftData) return null;

    return Shift.create(
      mapShiftPrismaToDomain(shiftData),
      new UniqueEntityID(shiftData.id),
    );
  }

  async findByName(name: string, tenantId: string): Promise<Shift | null> {
    const shiftData = await prisma.shift.findFirst({
      where: { name, tenantId, deletedAt: null },
    });

    if (!shiftData) return null;

    return Shift.create(
      mapShiftPrismaToDomain(shiftData),
      new UniqueEntityID(shiftData.id),
    );
  }

  async findByCode(code: string, tenantId: string): Promise<Shift | null> {
    const shiftData = await prisma.shift.findFirst({
      where: { code, tenantId, deletedAt: null },
    });

    if (!shiftData) return null;

    return Shift.create(
      mapShiftPrismaToDomain(shiftData),
      new UniqueEntityID(shiftData.id),
    );
  }

  async findMany(tenantId: string): Promise<Shift[]> {
    const shifts = await prisma.shift.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return shifts.map((shiftData) =>
      Shift.create(
        mapShiftPrismaToDomain(shiftData),
        new UniqueEntityID(shiftData.id),
      ),
    );
  }

  async findManyActive(tenantId: string): Promise<Shift[]> {
    const shifts = await prisma.shift.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return shifts.map((shiftData) =>
      Shift.create(
        mapShiftPrismaToDomain(shiftData),
        new UniqueEntityID(shiftData.id),
      ),
    );
  }

  async update(data: UpdateShiftSchema): Promise<Shift | null> {
    const existing = await prisma.shift.findFirst({
      where: { id: data.id.toString(), deletedAt: null },
    });

    if (!existing) return null;

    const shiftData = await prisma.shift.update({
      where: { id: data.id.toString() },
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes,
        isNightShift: data.isNightShift,
        color: data.color,
        isActive: data.isActive,
      },
    });

    return Shift.create(
      mapShiftPrismaToDomain(shiftData),
      new UniqueEntityID(shiftData.id),
    );
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    await prisma.shift.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async countAssignments(shiftId: UniqueEntityID): Promise<number> {
    return prisma.shiftAssignment.count({
      where: { shiftId: shiftId.toString(), isActive: true },
    });
  }
}
