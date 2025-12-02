import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PayrollItem } from '@/entities/hr/payroll-item';
import { prisma } from '@/lib/prisma';
import { mapPayrollItemPrismaToDomain } from '@/mappers/hr/payroll-item';
import type { PayrollItemType } from '@prisma/client';
import type {
    CreatePayrollItemSchema,
    FindPayrollItemFilters,
    PayrollItemsRepository,
    UpdatePayrollItemSchema,
} from '../payroll-items-repository';

export class PrismaPayrollItemsRepository implements PayrollItemsRepository {
  async create(data: CreatePayrollItemSchema): Promise<PayrollItem> {
    const itemData = await prisma.payrollItem.create({
      data: {
        payrollId: data.payrollId.toString(),
        employeeId: data.employeeId.toString(),
        type: data.type as PayrollItemType,
        description: data.description,
        amount: data.amount,
        isDeduction: data.isDeduction ?? false,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
      },
    });

    return PayrollItem.create(
      mapPayrollItemPrismaToDomain(itemData),
      new UniqueEntityID(itemData.id),
    );
  }

  async createMany(data: CreatePayrollItemSchema[]): Promise<PayrollItem[]> {
    const items: PayrollItem[] = [];

    for (const item of data) {
      const created = await this.create(item);
      items.push(created);
    }

    return items;
  }

  async findById(id: UniqueEntityID): Promise<PayrollItem | null> {
    const itemData = await prisma.payrollItem.findUnique({
      where: { id: id.toString() },
    });

    if (!itemData) return null;

    return PayrollItem.create(
      mapPayrollItemPrismaToDomain(itemData),
      new UniqueEntityID(itemData.id),
    );
  }

  async findMany(filters?: FindPayrollItemFilters): Promise<PayrollItem[]> {
    const items = await prisma.payrollItem.findMany({
      where: {
        payrollId: filters?.payrollId?.toString(),
        employeeId: filters?.employeeId?.toString(),
        type: filters?.type as PayrollItemType | undefined,
        isDeduction: filters?.isDeduction,
      },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) =>
      PayrollItem.create(
        mapPayrollItemPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByPayroll(payrollId: UniqueEntityID): Promise<PayrollItem[]> {
    const items = await prisma.payrollItem.findMany({
      where: {
        payrollId: payrollId.toString(),
      },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) =>
      PayrollItem.create(
        mapPayrollItemPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByEmployee(employeeId: UniqueEntityID): Promise<PayrollItem[]> {
    const items = await prisma.payrollItem.findMany({
      where: {
        employeeId: employeeId.toString(),
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) =>
      PayrollItem.create(
        mapPayrollItemPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByPayrollAndEmployee(
    payrollId: UniqueEntityID,
    employeeId: UniqueEntityID,
  ): Promise<PayrollItem[]> {
    const items = await prisma.payrollItem.findMany({
      where: {
        payrollId: payrollId.toString(),
        employeeId: employeeId.toString(),
      },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) =>
      PayrollItem.create(
        mapPayrollItemPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async sumByPayroll(
    payrollId: UniqueEntityID,
  ): Promise<{ totalGross: number; totalDeductions: number }> {
    const [grossResult, deductionsResult] = await Promise.all([
      prisma.payrollItem.aggregate({
        _sum: { amount: true },
        where: {
          payrollId: payrollId.toString(),
          isDeduction: false,
        },
      }),
      prisma.payrollItem.aggregate({
        _sum: { amount: true },
        where: {
          payrollId: payrollId.toString(),
          isDeduction: true,
        },
      }),
    ]);

    return {
      totalGross: Number(grossResult._sum?.amount ?? 0),
      totalDeductions: Number(deductionsResult._sum?.amount ?? 0),
    };
  }

  async sumByPayrollAndEmployee(
    payrollId: UniqueEntityID,
    employeeId: UniqueEntityID,
  ): Promise<{ totalGross: number; totalDeductions: number }> {
    const [grossResult, deductionsResult] = await Promise.all([
      prisma.payrollItem.aggregate({
        _sum: { amount: true },
        where: {
          payrollId: payrollId.toString(),
          employeeId: employeeId.toString(),
          isDeduction: false,
        },
      }),
      prisma.payrollItem.aggregate({
        _sum: { amount: true },
        where: {
          payrollId: payrollId.toString(),
          employeeId: employeeId.toString(),
          isDeduction: true,
        },
      }),
    ]);

    return {
      totalGross: Number(grossResult._sum?.amount ?? 0),
      totalDeductions: Number(deductionsResult._sum?.amount ?? 0),
    };
  }

  async update(data: UpdatePayrollItemSchema): Promise<PayrollItem | null> {
    const existingItem = await prisma.payrollItem.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingItem) return null;

    const itemData = await prisma.payrollItem.update({
      where: { id: data.id.toString() },
      data: {
        description: data.description,
        amount: data.amount,
      },
    });

    return PayrollItem.create(
      mapPayrollItemPrismaToDomain(itemData),
      new UniqueEntityID(itemData.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.payrollItem.delete({
      where: { id: id.toString() },
    });
  }

  async deleteByPayroll(payrollId: UniqueEntityID): Promise<void> {
    await prisma.payrollItem.deleteMany({
      where: { payrollId: payrollId.toString() },
    });
  }
}
