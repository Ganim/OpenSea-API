import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Termination } from '@/entities/hr/termination';
import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { mapTerminationPrismaToDomain } from '@/mappers/hr/termination';
import type {
  CreateTerminationSchema,
  FindTerminationFilters,
  TerminationsRepository,
  UpdateTerminationSchema,
} from '../terminations-repository';

export class PrismaTerminationsRepository implements TerminationsRepository {
  async create(data: CreateTerminationSchema): Promise<Termination> {
    const record = await prisma.termination.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        type: data.type,
        terminationDate: data.terminationDate,
        lastWorkDay: data.lastWorkDay,
        noticeType: data.noticeType,
        noticeDays: data.noticeDays,
        paymentDeadline: data.paymentDeadline,
        notes: data.notes,
        status: 'PENDING',
      },
    });

    return Termination.create(
      mapTerminationPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<Termination | null> {
    const client = tx ?? prisma;
    const record = await client.termination.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;

    return Termination.create(
      mapTerminationPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Termination | null> {
    const record = await prisma.termination.findFirst({
      where: { employeeId: employeeId.toString(), tenantId },
    });

    if (!record) return null;

    return Termination.create(
      mapTerminationPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindTerminationFilters,
  ): Promise<Termination[]> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const records = await prisma.termination.findMany({
      where: {
        tenantId,
        employeeId: filters?.employeeId?.toString(),
        status: filters?.status,
        type: filters?.type,
        terminationDate: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      orderBy: { terminationDate: 'desc' },
      skip,
      take: perPage,
    });

    return records.map((r) =>
      Termination.create(
        mapTerminationPrismaToDomain(r),
        new UniqueEntityID(r.id),
      ),
    );
  }

  async countMany(
    tenantId: string,
    filters?: FindTerminationFilters,
  ): Promise<number> {
    return prisma.termination.count({
      where: {
        tenantId,
        employeeId: filters?.employeeId?.toString(),
        status: filters?.status,
        type: filters?.type,
        terminationDate: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
    });
  }

  async update(data: UpdateTerminationSchema): Promise<Termination | null> {
    const existing = await prisma.termination.findUnique({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
    });

    if (!existing) return null;

    const record = await prisma.termination.update({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
      data: {
        status: data.status,
        paidAt: data.paidAt,
        notes: data.notes,
        saldoSalario: data.saldoSalario,
        avisoIndenizado: data.avisoIndenizado,
        decimoTerceiroProp: data.decimoTerceiroProp,
        feriasVencidas: data.feriasVencidas,
        feriasVencidasTerco: data.feriasVencidasTerco,
        feriasProporcional: data.feriasProporcional,
        feriasProporcionalTerco: data.feriasProporcionalTerco,
        multaFgts: data.multaFgts,
        inssRescisao: data.inssRescisao,
        irrfRescisao: data.irrfRescisao,
        outrosDescontos: data.outrosDescontos,
        totalBruto: data.totalBruto,
        totalDescontos: data.totalDescontos,
        totalLiquido: data.totalLiquido,
      },
    });

    return Termination.create(
      mapTerminationPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async save(termination: Termination, tx?: TransactionClient): Promise<void> {
    const client = tx ?? prisma;
    await client.termination.update({
      where: { id: termination.id.toString(), tenantId: termination.tenantId.toString(), },
      data: {
        type: termination.type,
        terminationDate: termination.terminationDate,
        lastWorkDay: termination.lastWorkDay,
        noticeType: termination.noticeType,
        noticeDays: termination.noticeDays,
        saldoSalario: termination.saldoSalario,
        avisoIndenizado: termination.avisoIndenizado,
        decimoTerceiroProp: termination.decimoTerceiroProp,
        feriasVencidas: termination.feriasVencidas,
        feriasVencidasTerco: termination.feriasVencidasTerco,
        feriasProporcional: termination.feriasProporcional,
        feriasProporcionalTerco: termination.feriasProporcionalTerco,
        multaFgts: termination.multaFgts,
        inssRescisao: termination.inssRescisao,
        irrfRescisao: termination.irrfRescisao,
        outrosDescontos: termination.outrosDescontos,
        totalBruto: termination.totalBruto,
        totalDescontos: termination.totalDescontos,
        totalLiquido: termination.totalLiquido,
        paymentDeadline: termination.paymentDeadline,
        paidAt: termination.paidAt,
        status: termination.status,
        notes: termination.notes,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.termination.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }), },
    });
  }
}
