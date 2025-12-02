import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Payroll } from '@/entities/hr/payroll';
import { prisma } from '@/lib/prisma';
import { mapPayrollPrismaToDomain } from '@/mappers/hr/payroll';
import type { PayrollStatus } from '@prisma/client';
import type {
    CreatePayrollSchema,
    FindPayrollFilters,
    PayrollsRepository,
    UpdatePayrollSchema,
} from '../payrolls-repository';

export class PrismaPayrollsRepository implements PayrollsRepository {
  async create(data: CreatePayrollSchema): Promise<Payroll> {
    const payrollData = await prisma.payroll.create({
      data: {
        referenceMonth: data.referenceMonth,
        referenceYear: data.referenceYear,
        status: 'DRAFT',
        totalGross: data.totalGross ?? 0,
        totalDeductions: data.totalDeductions ?? 0,
        totalNet: (data.totalGross ?? 0) - (data.totalDeductions ?? 0),
      },
    });

    return Payroll.create(
      mapPayrollPrismaToDomain(payrollData),
      new UniqueEntityID(payrollData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<Payroll | null> {
    const payrollData = await prisma.payroll.findUnique({
      where: { id: id.toString() },
      include: {
        items: true,
      },
    });

    if (!payrollData) return null;

    return Payroll.create(
      mapPayrollPrismaToDomain(payrollData),
      new UniqueEntityID(payrollData.id),
    );
  }

  async findByPeriod(
    referenceMonth: number,
    referenceYear: number,
  ): Promise<Payroll | null> {
    const payrollData = await prisma.payroll.findUnique({
      where: {
        referenceMonth_referenceYear: {
          referenceMonth,
          referenceYear,
        },
      },
      include: {
        items: true,
      },
    });

    if (!payrollData) return null;

    return Payroll.create(
      mapPayrollPrismaToDomain(payrollData),
      new UniqueEntityID(payrollData.id),
    );
  }

  async findMany(filters?: FindPayrollFilters): Promise<Payroll[]> {
    const payrolls = await prisma.payroll.findMany({
      where: {
        referenceMonth: filters?.referenceMonth,
        referenceYear: filters?.referenceYear,
        status: filters?.status as PayrollStatus | undefined,
      },
      include: {
        items: true,
      },
      orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }],
    });

    return payrolls.map((item) =>
      Payroll.create(
        mapPayrollPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByYear(year: number): Promise<Payroll[]> {
    const payrolls = await prisma.payroll.findMany({
      where: {
        referenceYear: year,
      },
      include: {
        items: true,
      },
      orderBy: { referenceMonth: 'asc' },
    });

    return payrolls.map((item) =>
      Payroll.create(
        mapPayrollPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByStatus(status: string): Promise<Payroll[]> {
    const payrolls = await prisma.payroll.findMany({
      where: {
        status: status as PayrollStatus,
      },
      include: {
        items: true,
      },
      orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }],
    });

    return payrolls.map((item) =>
      Payroll.create(
        mapPayrollPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async update(data: UpdatePayrollSchema): Promise<Payroll | null> {
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingPayroll) return null;

    const payrollData = await prisma.payroll.update({
      where: { id: data.id.toString() },
      data: {
        status: data.status as PayrollStatus | undefined,
        totalGross: data.totalGross,
        totalDeductions: data.totalDeductions,
        totalNet:
          data.totalGross !== undefined && data.totalDeductions !== undefined
            ? data.totalGross - data.totalDeductions
            : undefined,
        processedBy: data.processedBy?.toString(),
        processedAt: data.processedAt,
        approvedBy: data.approvedBy?.toString(),
        approvedAt: data.approvedAt,
        paidBy: data.paidBy?.toString(),
        paidAt: data.paidAt,
      },
      include: {
        items: true,
      },
    });

    return Payroll.create(
      mapPayrollPrismaToDomain(payrollData),
      new UniqueEntityID(payrollData.id),
    );
  }

  async save(payroll: Payroll): Promise<void> {
    await prisma.payroll.update({
      where: { id: payroll.id.toString() },
      data: {
        status: payroll.status.value as PayrollStatus,
        totalGross: payroll.totalGross,
        totalDeductions: payroll.totalDeductions,
        totalNet: payroll.totalNet,
        processedBy: payroll.processedBy?.toString(),
        processedAt: payroll.processedAt,
        approvedBy: payroll.approvedBy?.toString(),
        approvedAt: payroll.approvedAt,
        paidBy: payroll.paidBy?.toString(),
        paidAt: payroll.paidAt,
        updatedAt: payroll.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.payroll.delete({
      where: { id: id.toString() },
    });
  }
}
