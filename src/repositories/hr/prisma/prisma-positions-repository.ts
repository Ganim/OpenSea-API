import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Position } from '@/entities/hr/position';
import { prisma } from '@/lib/prisma';
import { mapPositionPrismaToDomain } from '@/mappers/hr/position/position-prisma-to-domain';
import type {
  CreatePositionSchema,
  FindManyPositionsParams,
  FindManyPositionsResult,
  PositionsRepository,
  UpdatePositionSchema,
} from '../positions-repository';

export class PrismaPositionsRepository implements PositionsRepository {
  async create(data: CreatePositionSchema): Promise<Position> {
    const positionData = await prisma.position.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        departmentId: data.departmentId?.toString(),
        level: data.level ?? 1,
        minSalary: data.minSalary,
        maxSalary: data.maxSalary,
        isActive: data.isActive ?? true,
      },
      include: {
        department: true,
      },
    });

    const position = Position.create(
      mapPositionPrismaToDomain(positionData),
      new UniqueEntityID(positionData.id),
    );
    return position;
  }

  async findById(id: UniqueEntityID): Promise<Position | null> {
    const positionData = await prisma.position.findFirst({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
      include: {
        department: true,
      },
    });

    if (!positionData) return null;

    const position = Position.create(
      mapPositionPrismaToDomain(positionData),
      new UniqueEntityID(positionData.id),
    );
    return position;
  }

  async findByCode(code: string): Promise<Position | null> {
    const positionData = await prisma.position.findFirst({
      where: {
        code,
        deletedAt: null,
      },
      include: {
        department: true,
      },
    });

    if (!positionData) return null;

    const position = Position.create(
      mapPositionPrismaToDomain(positionData),
      new UniqueEntityID(positionData.id),
    );
    return position;
  }

  async findMany(
    params: FindManyPositionsParams,
  ): Promise<FindManyPositionsResult> {
    const {
      page = 1,
      perPage = 20,
      search,
      isActive,
      departmentId,
      level,
    } = params;

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
      ...(departmentId && { departmentId: departmentId.toString() }),
      ...(level !== undefined && { level }),
    };

    const [positions, total] = await Promise.all([
      prisma.position.findMany({
        where,
        include: {
          department: true,
        },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
      }),
      prisma.position.count({ where }),
    ]);

    return {
      positions: positions.map((pos) =>
        Position.create(
          mapPositionPrismaToDomain(pos),
          new UniqueEntityID(pos.id),
        ),
      ),
      total,
    };
  }

  async findManyByDepartment(
    departmentId: UniqueEntityID,
  ): Promise<Position[]> {
    const positions = await prisma.position.findMany({
      where: {
        departmentId: departmentId.toString(),
        deletedAt: null,
      },
      include: {
        department: true,
      },
    });

    return positions.map((pos) =>
      Position.create(
        mapPositionPrismaToDomain(pos),
        new UniqueEntityID(pos.id),
      ),
    );
  }

  async findManyByLevel(level: number): Promise<Position[]> {
    const positions = await prisma.position.findMany({
      where: {
        level,
        deletedAt: null,
      },
      include: {
        department: true,
      },
    });

    return positions.map((pos) =>
      Position.create(
        mapPositionPrismaToDomain(pos),
        new UniqueEntityID(pos.id),
      ),
    );
  }

  async findManyActive(): Promise<Position[]> {
    const positions = await prisma.position.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        department: true,
      },
    });

    return positions.map((pos) =>
      Position.create(
        mapPositionPrismaToDomain(pos),
        new UniqueEntityID(pos.id),
      ),
    );
  }

  async hasEmployees(id: UniqueEntityID): Promise<boolean> {
    const count = await prisma.employee.count({
      where: {
        positionId: id.toString(),
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async update(data: UpdatePositionSchema): Promise<Position | null> {
    const existing = await prisma.position.findFirst({
      where: {
        id: data.id.toString(),
        deletedAt: null,
      },
    });

    if (!existing) return null;

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.departmentId !== undefined)
      updateData.departmentId = data.departmentId?.toString() ?? null;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.minSalary !== undefined) updateData.minSalary = data.minSalary;
    if (data.maxSalary !== undefined) updateData.maxSalary = data.maxSalary;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const positionData = await prisma.position.update({
      where: { id: data.id.toString() },
      data: updateData,
      include: {
        department: true,
      },
    });

    return Position.create(
      mapPositionPrismaToDomain(positionData),
      new UniqueEntityID(positionData.id),
    );
  }

  async save(position: Position): Promise<void> {
    await prisma.position.update({
      where: { id: position.id.toString() },
      data: {
        name: position.name,
        code: position.code,
        description: position.description,
        departmentId: position.departmentId?.toString() ?? null,
        level: position.level,
        minSalary: position.minSalary,
        maxSalary: position.maxSalary,
        isActive: position.isActive,
        deletedAt: position.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.position.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
