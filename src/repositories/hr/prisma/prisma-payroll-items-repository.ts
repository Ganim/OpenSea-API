import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PayrollItem } from '@/entities/hr/payroll-item';
import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { mapPayrollItemPrismaToDomain } from '@/mappers/hr/payroll-item';
import type { PayrollItemType } from '@prisma/generated/client.js';
import type {
  CreatePayrollItemSchema,
  FindPayrollItemFilters,
  PayrollItemsRepository,
  UpdatePayrollItemSchema,
} from '../payroll-items-repository';

export class PrismaPayrollItemsRepository implements PayrollItemsRepository {
  async create(
    data: CreatePayrollItemSchema,
    tx?: TransactionClient,
  ): Promise<PayrollItem> {
    const client = tx ?? prisma;
    const itemData = await client.payrollItem.create({
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

  async createMany(
    data: CreatePayrollItemSchema[],
    tx?: TransactionClient,
  ): Promise<PayrollItem[]> {
    if (data.length === 0) return [];

    const client = tx ?? prisma;

    await client.payrollItem.createMany({
      data: data.map((item) => ({
        payrollId: item.payrollId.toString(),
        employeeId: item.employeeId.toString(),
        type: item.type as PayrollItemType,
        description: item.description,
        amount: item.amount,
        isDeduction: item.isDeduction ?? false,
        referenceId: item.referenceId,
        referenceType: item.referenceType,
      })),
    });

    // Fetch inserted items to return domain entities
    // All items share the same payrollId, so we can query by it
    const payrollId = data[0].payrollId.toString();
    const insertedItems = await client.payrollItem.findMany({
      where: { payrollId },
      orderBy: { createdAt: 'asc' },
    });

    return insertedItems.map((item) =>
      PayrollItem.create(
        mapPayrollItemPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
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

  async findManyByPayroll(
    payrollId: UniqueEntityID,
    tx?: TransactionClient,
  ): Promise<PayrollItem[]> {
    const client = tx ?? prisma;
    const items = await client.payrollItem.findMany({
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
    tx?: TransactionClient,
  ): Promise<{ totalGross: number; totalDeductions: number }> {
    const client = tx ?? prisma;
    const [grossResult, deductionsResult] = await Promise.all([
      client.payrollItem.aggregate({
        _sum: { amount: true },
        where: {
          payrollId: payrollId.toString(),
          isDeduction: false,
        },
      }),
      client.payrollItem.aggregate({
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
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
    });

    if (!existingItem) return null;

    const itemData = await prisma.payrollItem.update({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
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

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.payrollItem.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }), },
    });
  }

  async deleteByPayroll(payrollId: UniqueEntityID): Promise<void> {
    await prisma.payrollItem.deleteMany({
      where: { payrollId: payrollId.toString() },
    });
  }
}
