import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deduction } from '@/entities/hr/deduction';
import { prisma } from '@/lib/prisma';
import { mapDeductionPrismaToDomain } from '@/mappers/hr/deduction';
import type {
  CreateDeductionSchema,
  DeductionsRepository,
  FindDeductionFilters,
  UpdateDeductionSchema,
} from '../deductions-repository';

export class PrismaDeductionsRepository implements DeductionsRepository {
  async create(data: CreateDeductionSchema): Promise<Deduction> {
    const deductionData = await prisma.deduction.create({
      data: {
        employeeId: data.employeeId.toString(),
        name: data.name,
        amount: data.amount,
        reason: data.reason,
        date: data.date,
        isRecurring: data.isRecurring ?? false,
        installments: data.installments,
        currentInstallment: 0,
        isApplied: false,
      },
    });

    return Deduction.create(
      mapDeductionPrismaToDomain(deductionData),
      new UniqueEntityID(deductionData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<Deduction | null> {
    const deductionData = await prisma.deduction.findUnique({
      where: { id: id.toString() },
    });

    if (!deductionData) return null;

    return Deduction.create(
      mapDeductionPrismaToDomain(deductionData),
      new UniqueEntityID(deductionData.id),
    );
  }

  async findMany(filters?: FindDeductionFilters): Promise<Deduction[]> {
    const deductions = await prisma.deduction.findMany({
      where: {
        employeeId: filters?.employeeId?.toString(),
        isApplied: filters?.isApplied,
        isRecurring: filters?.isRecurring,
        date: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    return deductions.map((item) =>
      Deduction.create(
        mapDeductionPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByEmployee(employeeId: UniqueEntityID): Promise<Deduction[]> {
    const deductions = await prisma.deduction.findMany({
      where: {
        employeeId: employeeId.toString(),
      },
      orderBy: { date: 'desc' },
    });

    return deductions.map((item) =>
      Deduction.create(
        mapDeductionPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyPending(): Promise<Deduction[]> {
    const deductions = await prisma.deduction.findMany({
      where: {
        isApplied: false,
      },
      orderBy: { date: 'asc' },
    });

    return deductions.map((item) =>
      Deduction.create(
        mapDeductionPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyPendingByEmployee(
    employeeId: UniqueEntityID,
  ): Promise<Deduction[]> {
    const deductions = await prisma.deduction.findMany({
      where: {
        employeeId: employeeId.toString(),
        isApplied: false,
      },
      orderBy: { date: 'asc' },
    });

    return deductions.map((item) =>
      Deduction.create(
        mapDeductionPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findPendingByEmployee(
    employeeId: UniqueEntityID,
  ): Promise<Deduction[]> {
    return this.findManyPendingByEmployee(employeeId);
  }

  async findManyRecurring(): Promise<Deduction[]> {
    const deductions = await prisma.deduction.findMany({
      where: {
        isRecurring: true,
      },
      orderBy: { date: 'asc' },
    });

    return deductions.map((item) =>
      Deduction.create(
        mapDeductionPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyRecurringByEmployee(
    employeeId: UniqueEntityID,
  ): Promise<Deduction[]> {
    const deductions = await prisma.deduction.findMany({
      where: {
        employeeId: employeeId.toString(),
        isRecurring: true,
      },
      orderBy: { date: 'asc' },
    });

    return deductions.map((item) =>
      Deduction.create(
        mapDeductionPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByPeriod(startDate: Date, endDate: Date): Promise<Deduction[]> {
    const deductions = await prisma.deduction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return deductions.map((item) =>
      Deduction.create(
        mapDeductionPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async sumPendingByEmployee(employeeId: UniqueEntityID): Promise<number> {
    const result = await prisma.deduction.aggregate({
      _sum: { amount: true },
      where: {
        employeeId: employeeId.toString(),
        isApplied: false,
      },
    });

    return Number(result._sum?.amount ?? 0);
  }

  async update(data: UpdateDeductionSchema): Promise<Deduction | null> {
    const existingDeduction = await prisma.deduction.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingDeduction) return null;

    const deductionData = await prisma.deduction.update({
      where: { id: data.id.toString() },
      data: {
        name: data.name,
        amount: data.amount,
        reason: data.reason,
        date: data.date,
        isRecurring: data.isRecurring,
        installments: data.installments,
        currentInstallment: data.currentInstallment,
        isApplied: data.isApplied,
        appliedAt: data.appliedAt,
      },
    });

    return Deduction.create(
      mapDeductionPrismaToDomain(deductionData),
      new UniqueEntityID(deductionData.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.deduction.delete({
      where: { id: id.toString() },
    });
  }

  async save(deduction: Deduction): Promise<void> {
    await prisma.deduction.update({
      where: { id: deduction.id.toString() },
      data: {
        name: deduction.name,
        amount: deduction.amount,
        reason: deduction.reason,
        date: deduction.date,
        isRecurring: deduction.isRecurring,
        installments: deduction.installments,
        currentInstallment: deduction.currentInstallment ?? 0,
        isApplied: deduction.isApplied,
        appliedAt: deduction.appliedAt,
      },
    });
  }
}
