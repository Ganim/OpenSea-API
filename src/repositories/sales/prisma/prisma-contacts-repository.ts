import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Contact } from '@/entities/sales/contact';
import type { TransactionClient } from '@/lib/transaction-manager';
import { prisma } from '@/lib/prisma';
import { contactPrismaToDomain } from '@/mappers/sales/contact/contact-prisma-to-domain';
import type {
  ContactRole as PrismaContactRole,
  ContactSource as PrismaContactSource,
  LeadTemperature as PrismaLeadTemperature,
  LifecycleStage as PrismaLifecycleStage,
  Prisma,
} from '@prisma/generated/client';
import type { PaginatedResult } from '../../pagination-params';
import type {
  ContactsRepository,
  CreateContactSchema,
  FindManyContactsOptions,
  UpdateContactSchema,
} from '../contacts-repository';

export class PrismaContactsRepository implements ContactsRepository {
  async create(
    data: CreateContactSchema,
    tx?: TransactionClient,
  ): Promise<Contact> {
    const client = tx ?? prisma;

    const raw = await client.contact.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        role: data.role.value as PrismaContactRole,
        jobTitle: data.jobTitle,
        department: data.department,
        lifecycleStage: (data.lifecycleStage?.value ??
          'LEAD') as PrismaLifecycleStage,
        leadScore: data.leadScore ?? 0,
        leadTemperature:
          (data.leadTemperature as PrismaLeadTemperature) ?? undefined,
        source: data.source as PrismaContactSource,
        lastInteractionAt: data.lastInteractionAt,
        lastChannelUsed: data.lastChannelUsed,
        socialProfiles:
          (data.socialProfiles as Prisma.InputJsonValue) ?? undefined,
        tags: data.tags ?? [],
        customFields:
          (data.customFields as Prisma.InputJsonValue) ?? undefined,
        avatarUrl: data.avatarUrl,
        assignedToUserId: data.assignedToUserId,
        isMainContact: data.isMainContact ?? false,
      },
    });

    return contactPrismaToDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Contact | null> {
    const raw = await prisma.contact.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!raw) {
      return null;
    }

    return contactPrismaToDomain(raw);
  }

  async findByEmail(
    email: string,
    tenantId: string,
  ): Promise<Contact | null> {
    const raw = await prisma.contact.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        tenantId,
        deletedAt: null,
      },
    });

    if (!raw) {
      return null;
    }

    return contactPrismaToDomain(raw);
  }

  async findByPhone(
    phone: string,
    tenantId: string,
  ): Promise<Contact | null> {
    const raw = await prisma.contact.findFirst({
      where: {
        phone,
        tenantId,
        deletedAt: null,
      },
    });

    if (!raw) {
      return null;
    }

    return contactPrismaToDomain(raw);
  }

  async findManyPaginated(
    options: FindManyContactsOptions,
  ): Promise<PaginatedResult<Contact>> {
    const {
      tenantId,
      page,
      limit,
      search,
      customerId,
      lifecycleStage,
      leadTemperature,
      assignedToUserId,
      sortBy,
      sortOrder,
    } = options;

    const where: Prisma.ContactWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(customerId && { customerId }),
      ...(lifecycleStage && {
        lifecycleStage: lifecycleStage as PrismaLifecycleStage,
      }),
      ...(leadTemperature && {
        leadTemperature: leadTemperature as PrismaLeadTemperature,
      }),
      ...(assignedToUserId && { assignedToUserId }),
    };

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: {
          [sortBy ?? 'createdAt']: sortOrder ?? 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      data: data.map(contactPrismaToDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findManyByCustomer(
    customerId: UniqueEntityID,
    tenantId: string,
  ): Promise<Contact[]> {
    const data = await prisma.contact.findMany({
      where: {
        customerId: customerId.toString(),
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return data.map(contactPrismaToDomain);
  }

  async update(
    data: UpdateContactSchema,
    tx?: TransactionClient,
  ): Promise<Contact | null> {
    const client = tx ?? prisma;

    const raw = await client.contact.update({
      where: {
        id: data.id.toString(),
        tenantId: data.tenantId,
        deletedAt: null,
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        role: data.role?.value as PrismaContactRole | undefined,
        jobTitle: data.jobTitle,
        department: data.department,
        lifecycleStage: data.lifecycleStage?.value as
          | PrismaLifecycleStage
          | undefined,
        leadScore: data.leadScore,
        leadTemperature: data.leadTemperature as
          | PrismaLeadTemperature
          | undefined,
        source: data.source as PrismaContactSource | undefined,
        lastInteractionAt: data.lastInteractionAt,
        lastChannelUsed: data.lastChannelUsed,
        socialProfiles:
          (data.socialProfiles as Prisma.InputJsonValue) ?? undefined,
        tags: data.tags,
        customFields:
          (data.customFields as Prisma.InputJsonValue) ?? undefined,
        avatarUrl: data.avatarUrl,
        assignedToUserId: data.assignedToUserId,
        isMainContact: data.isMainContact,
      },
    });

    return contactPrismaToDomain(raw);
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.contact.update({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async count(tenantId: string): Promise<number> {
    return prisma.contact.count({
      where: {
        tenantId,
        deletedAt: null,
      },
    });
  }
}
