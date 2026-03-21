import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Contact } from '@/entities/sales/contact';
import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  ContactsRepository,
  CreateContactSchema,
  FindManyPaginatedParams,
  UpdateContactSchema,
} from '../contacts-repository';
import type { ContactRole as PrismaContactRole, ContactLifecycleStage as PrismaLifecycleStage } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): Contact {
  return Contact.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      customerId: new UniqueEntityID(data.customerId as string),
      firstName: data.firstName as string,
      lastName: (data.lastName as string) ?? undefined,
      email: (data.email as string) ?? undefined,
      phone: (data.phone as string) ?? undefined,
      whatsapp: (data.whatsapp as string) ?? undefined,
      role: ContactRole.create(data.role as string),
      jobTitle: (data.jobTitle as string) ?? undefined,
      department: (data.department as string) ?? undefined,
      lifecycleStage: LifecycleStage.create(data.lifecycleStage as string),
      leadScore: data.leadScore as number,
      leadTemperature: (data.leadTemperature as string) ?? undefined,
      source: (data.source as string) ?? 'MANUAL',
      lastInteractionAt: (data.lastInteractionAt as Date) ?? undefined,
      lastChannelUsed: (data.lastChannelUsed as string) ?? undefined,
      socialProfiles: (data.socialProfiles as Record<string, unknown>) ?? undefined,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      customFields: (data.customFields as Record<string, unknown>) ?? undefined,
      avatarUrl: (data.avatarUrl as string) ?? undefined,
      assignedToUserId: data.assignedToUserId
        ? new UniqueEntityID(data.assignedToUserId as string)
        : undefined,
      isMainContact: data.isMainContact as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaContactsRepository implements ContactsRepository {
  async create(data: CreateContactSchema): Promise<Contact> {
    const fullName = data.lastName
      ? `${data.firstName} ${data.lastName}`
      : data.firstName;

    const contactData = await prisma.crmContact.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        role: (data.role.value) as PrismaContactRole,
        jobTitle: data.jobTitle,
        department: data.department,
        lifecycleStage: (data.lifecycleStage.value) as PrismaLifecycleStage,
        leadScore: data.leadScore ?? 0,
        leadTemperature: data.leadTemperature,
        source: data.source ?? 'MANUAL',
        lastInteractionAt: data.lastInteractionAt,
        lastChannelUsed: data.lastChannelUsed,
        socialProfiles: data.socialProfiles ?? undefined,
        tags: data.tags ?? [],
        customFields: data.customFields ?? undefined,
        avatarUrl: data.avatarUrl,
        assignedToUserId: data.assignedToUserId,
        isMainContact: data.isMainContact ?? false,
      },
    });

    return mapToDomain(contactData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Contact | null> {
    const contactData = await prisma.crmContact.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!contactData) return null;
    return mapToDomain(contactData as unknown as Record<string, unknown>);
  }

  async findManyPaginated(
    params: FindManyPaginatedParams,
  ): Promise<PaginatedResult<Contact>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.customerId) {
      where.customerId = params.customerId;
    }
    if (params.lifecycleStage) {
      where.lifecycleStage = params.lifecycleStage;
    }
    if (params.leadTemperature) {
      where.leadTemperature = params.leadTemperature;
    }
    if (params.assignedToUserId) {
      where.assignedToUserId = params.assignedToUserId;
    }
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [contactsData, total] = await Promise.all([
      prisma.crmContact.findMany({
        where: where as Parameters<typeof prisma.crmContact.findMany>[0]['where'],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
      }),
      prisma.crmContact.count({
        where: where as Parameters<typeof prisma.crmContact.count>[0]['where'],
      }),
    ]);

    return {
      data: contactsData.map((c) =>
        mapToDomain(c as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async update(data: UpdateContactSchema): Promise<Contact | null> {
    try {
      const updateData: Record<string, unknown> = {};

      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
      if (data.role !== undefined) updateData.role = data.role.value;
      if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
      if (data.department !== undefined) updateData.department = data.department;
      if (data.lifecycleStage !== undefined)
        updateData.lifecycleStage = data.lifecycleStage.value;
      if (data.leadScore !== undefined) updateData.leadScore = data.leadScore;
      if (data.leadTemperature !== undefined)
        updateData.leadTemperature = data.leadTemperature;
      if (data.source !== undefined) updateData.source = data.source;
      if (data.lastInteractionAt !== undefined)
        updateData.lastInteractionAt = data.lastInteractionAt;
      if (data.lastChannelUsed !== undefined)
        updateData.lastChannelUsed = data.lastChannelUsed;
      if (data.socialProfiles !== undefined)
        updateData.socialProfiles = data.socialProfiles;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.customFields !== undefined)
        updateData.customFields = data.customFields;
      if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
      if (data.assignedToUserId !== undefined)
        updateData.assignedToUserId = data.assignedToUserId;
      if (data.isMainContact !== undefined)
        updateData.isMainContact = data.isMainContact;

      // Recompute fullName if name changed
      if (data.firstName !== undefined || data.lastName !== undefined) {
        const existing = await prisma.crmContact.findFirst({
          where: { id: data.id.toString(), tenantId: data.tenantId },
        });
        if (existing) {
          const firstName = data.firstName ?? existing.firstName;
          const lastName = data.lastName !== undefined ? data.lastName : existing.lastName;
          updateData.fullName = lastName ? `${firstName} ${lastName}` : firstName;
        }
      }

      const contactData = await prisma.crmContact.update({
        where: { id: data.id.toString() },
        data: updateData,
      });

      return mapToDomain(contactData as unknown as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.crmContact.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
