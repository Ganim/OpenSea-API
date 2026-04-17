import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ShiftAssignment } from '@/entities/hr/shift-assignment';
import { prisma } from '@/lib/prisma';
import { mapShiftAssignmentPrismaToDomain } from '@/mappers/hr/shift-assignment';
import type {
  CreateShiftAssignmentSchema,
  ShiftAssignmentsRepository,
} from '../shift-assignments-repository';

export class PrismaShiftAssignmentsRepository
  implements ShiftAssignmentsRepository
{
  async create(data: CreateShiftAssignmentSchema): Promise<ShiftAssignment> {
    const assignmentData = await prisma.shiftAssignment.create({
      data: {
        tenantId: data.tenantId,
        shiftId: data.shiftId,
        employeeId: data.employeeId,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true,
        notes: data.notes,
      },
    });

    return ShiftAssignment.create(
      mapShiftAssignmentPrismaToDomain(assignmentData),
      new UniqueEntityID(assignmentData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ShiftAssignment | null> {
    const assignmentData = await prisma.shiftAssignment.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!assignmentData) return null;

    return ShiftAssignment.create(
      mapShiftAssignmentPrismaToDomain(assignmentData),
      new UniqueEntityID(assignmentData.id),
    );
  }

  async findActiveByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<ShiftAssignment | null> {
    const assignmentData = await prisma.shiftAssignment.findFirst({
      where: { employeeId, tenantId, isActive: true },
      orderBy: { startDate: 'desc' },
    });

    if (!assignmentData) return null;

    return ShiftAssignment.create(
      mapShiftAssignmentPrismaToDomain(assignmentData),
      new UniqueEntityID(assignmentData.id),
    );
  }

  async findManyByShift(
    shiftId: string,
    tenantId: string,
  ): Promise<ShiftAssignment[]> {
    const assignments = await prisma.shiftAssignment.findMany({
      where: { shiftId, tenantId },
      orderBy: { startDate: 'desc' },
    });

    return assignments.map((assignmentData) =>
      ShiftAssignment.create(
        mapShiftAssignmentPrismaToDomain(assignmentData),
        new UniqueEntityID(assignmentData.id),
      ),
    );
  }

  async findManyByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<ShiftAssignment[]> {
    const assignments = await prisma.shiftAssignment.findMany({
      where: { employeeId, tenantId },
      orderBy: { startDate: 'desc' },
    });

    return assignments.map((assignmentData) =>
      ShiftAssignment.create(
        mapShiftAssignmentPrismaToDomain(assignmentData),
        new UniqueEntityID(assignmentData.id),
      ),
    );
  }

  async deactivate(
    id: UniqueEntityID,
    tenantId?: string,
  ): Promise<ShiftAssignment | null> {
    const existing = await prisma.shiftAssignment.findFirst({
      where: {
        id: id.toString(),
        ...(tenantId && { tenantId }),
      },
      select: { id: true },
    });

    if (!existing) return null;

    const assignmentData = await prisma.shiftAssignment.update({
      where: {
        id: id.toString(),
        ...(tenantId && { tenantId }),
      },
      data: { isActive: false, endDate: new Date() },
    });

    return ShiftAssignment.create(
      mapShiftAssignmentPrismaToDomain(assignmentData),
      new UniqueEntityID(assignmentData.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.shiftAssignment.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
    });
  }
}
