import { Plan } from '@/entities/core/plan';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type { PlanTierEnum } from '@prisma/generated/client.js';
import type {
  CreatePlanSchema,
  PlansRepository,
  UpdatePlanSchema,
} from '../plans-repository';

export class PrismaPlansRepository implements PlansRepository {
  async create(data: CreatePlanSchema): Promise<Plan> {
    const planDb = await prisma.plan.create({
      data: {
        name: data.name,
        tier: (data.tier ?? 'FREE') as PlanTierEnum,
        description: data.description ?? null,
        price: data.price ?? 0,
        isActive: data.isActive ?? true,
        maxUsers: data.maxUsers ?? 5,
        maxWarehouses: data.maxWarehouses ?? 1,
        maxProducts: data.maxProducts ?? 100,
      },
    });

    return Plan.create(
      {
        name: planDb.name,
        tier: planDb.tier as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
        description: planDb.description,
        price: planDb.price,
        isActive: planDb.isActive,
        maxUsers: planDb.maxUsers,
        maxWarehouses: planDb.maxWarehouses,
        maxProducts: planDb.maxProducts,
        createdAt: planDb.createdAt,
        updatedAt: planDb.updatedAt,
      },
      new UniqueEntityID(planDb.id),
    );
  }

  async update(data: UpdatePlanSchema): Promise<Plan | null> {
    const existing = await prisma.plan.findUnique({
      where: { id: data.id.toString() },
    });
    if (!existing) return null;

    const planDb = await prisma.plan.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.tier !== undefined && { tier: data.tier as PlanTierEnum }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.maxUsers !== undefined && { maxUsers: data.maxUsers }),
        ...(data.maxWarehouses !== undefined && {
          maxWarehouses: data.maxWarehouses,
        }),
        ...(data.maxProducts !== undefined && {
          maxProducts: data.maxProducts,
        }),
      },
    });

    return Plan.create(
      {
        name: planDb.name,
        tier: planDb.tier as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
        description: planDb.description,
        price: planDb.price,
        isActive: planDb.isActive,
        maxUsers: planDb.maxUsers,
        maxWarehouses: planDb.maxWarehouses,
        maxProducts: planDb.maxProducts,
        createdAt: planDb.createdAt,
        updatedAt: planDb.updatedAt,
      },
      new UniqueEntityID(planDb.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<Plan | null> {
    const planDb = await prisma.plan.findUnique({
      where: { id: id.toString() },
    });
    if (!planDb) return null;

    return Plan.create(
      {
        name: planDb.name,
        tier: planDb.tier as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
        description: planDb.description,
        price: planDb.price,
        isActive: planDb.isActive,
        maxUsers: planDb.maxUsers,
        maxWarehouses: planDb.maxWarehouses,
        maxProducts: planDb.maxProducts,
        createdAt: planDb.createdAt,
        updatedAt: planDb.updatedAt,
      },
      new UniqueEntityID(planDb.id),
    );
  }

  async findByName(name: string): Promise<Plan | null> {
    const planDb = await prisma.plan.findFirst({
      where: { name },
    });
    if (!planDb) return null;

    return Plan.create(
      {
        name: planDb.name,
        tier: planDb.tier as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
        description: planDb.description,
        price: planDb.price,
        isActive: planDb.isActive,
        maxUsers: planDb.maxUsers,
        maxWarehouses: planDb.maxWarehouses,
        maxProducts: planDb.maxProducts,
        createdAt: planDb.createdAt,
        updatedAt: planDb.updatedAt,
      },
      new UniqueEntityID(planDb.id),
    );
  }

  async findMany(): Promise<Plan[]> {
    const plansDb = await prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return plansDb.map((p) =>
      Plan.create(
        {
          name: p.name,
          tier: p.tier as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
          description: p.description,
          price: p.price,
          isActive: p.isActive,
          maxUsers: p.maxUsers,
          maxWarehouses: p.maxWarehouses,
          maxProducts: p.maxProducts,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        },
        new UniqueEntityID(p.id),
      ),
    );
  }
}
