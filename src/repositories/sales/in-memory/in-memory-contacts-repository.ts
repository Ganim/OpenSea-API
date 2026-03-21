import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Contact } from '@/entities/sales/contact';
import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import type {
  PaginatedResult,
  PaginationParams,
} from '../../pagination-params';
import type {
  ContactsRepository,
  CreateContactSchema,
  FindManyContactsOptions,
  UpdateContactSchema,
} from '../contacts-repository';

export class InMemoryContactsRepository implements ContactsRepository {
  public items: Contact[] = [];

  private paginate(
    items: Contact[],
    params: PaginationParams,
  ): PaginatedResult<Contact> {
    const total = items.length;
    const start = (params.page - 1) * params.limit;
    return {
      data: items.slice(start, start + params.limit),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  private activeByTenant(tenantId: string): Contact[] {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async create(data: CreateContactSchema): Promise<Contact> {
    const contact = Contact.create({
      tenantId: new UniqueEntityID(data.tenantId),
      customerId: new UniqueEntityID(data.customerId),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      role: data.role ?? ContactRole.create('OTHER'),
      jobTitle: data.jobTitle,
      department: data.department,
      lifecycleStage: data.lifecycleStage ?? LifecycleStage.create('LEAD'),
      leadScore: data.leadScore,
      leadTemperature: data.leadTemperature,
      source: data.source,
      lastInteractionAt: data.lastInteractionAt,
      lastChannelUsed: data.lastChannelUsed,
      socialProfiles: data.socialProfiles,
      tags: data.tags,
      customFields: data.customFields,
      avatarUrl: data.avatarUrl,
      assignedToUserId: data.assignedToUserId
        ? new UniqueEntityID(data.assignedToUserId)
        : undefined,
      isMainContact: data.isMainContact,
    });

    this.items.push(contact);
    return contact;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Contact | null> {
    const contact = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return contact ?? null;
  }

  async findByEmail(
    email: string,
    tenantId: string,
  ): Promise<Contact | null> {
    const contact = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.email?.toLowerCase() === email.toLowerCase() &&
        item.tenantId.toString() === tenantId,
    );
    return contact ?? null;
  }

  async findByPhone(
    phone: string,
    tenantId: string,
  ): Promise<Contact | null> {
    const contact = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.phone === phone &&
        item.tenantId.toString() === tenantId,
    );
    return contact ?? null;
  }

  async findManyPaginated(
    options: FindManyContactsOptions,
  ): Promise<PaginatedResult<Contact>> {
    let filtered = this.activeByTenant(options.tenantId);

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(searchLower) ||
          c.lastName?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower),
      );
    }

    if (options.customerId) {
      filtered = filtered.filter(
        (c) => c.customerId.toString() === options.customerId,
      );
    }

    if (options.lifecycleStage) {
      filtered = filtered.filter(
        (c) => c.lifecycleStage.value === options.lifecycleStage,
      );
    }

    if (options.leadTemperature) {
      filtered = filtered.filter(
        (c) => c.leadTemperature === options.leadTemperature,
      );
    }

    if (options.assignedToUserId) {
      filtered = filtered.filter(
        (c) => c.assignedToUserId?.toString() === options.assignedToUserId,
      );
    }

    if (options.sortBy) {
      const multiplier = options.sortOrder === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        switch (options.sortBy) {
          case 'firstName':
            return multiplier * a.firstName.localeCompare(b.firstName);
          case 'lastName':
            return (
              multiplier *
              (a.lastName ?? '').localeCompare(b.lastName ?? '')
            );
          case 'email':
            return (
              multiplier *
              (a.email ?? '').localeCompare(b.email ?? '')
            );
          case 'leadScore':
            return multiplier * (a.leadScore - b.leadScore);
          case 'createdAt':
          case 'updatedAt': {
            const dateA = a[options.sortBy!]?.getTime() ?? 0;
            const dateB = b[options.sortBy!]?.getTime() ?? 0;
            return multiplier * (dateA - dateB);
          }
          default:
            return 0;
        }
      });
    }

    return this.paginate(filtered, options);
  }

  async findManyByCustomer(
    customerId: UniqueEntityID,
    tenantId: string,
  ): Promise<Contact[]> {
    return this.activeByTenant(tenantId).filter((c) =>
      c.customerId.equals(customerId),
    );
  }

  async update(data: UpdateContactSchema): Promise<Contact | null> {
    const contact = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(data.id) &&
        item.tenantId.toString() === data.tenantId,
    );
    if (!contact) return null;

    if (data.firstName !== undefined) contact.firstName = data.firstName;
    if (data.lastName !== undefined) contact.lastName = data.lastName;
    if (data.email !== undefined) contact.email = data.email;
    if (data.phone !== undefined) contact.phone = data.phone;
    if (data.whatsapp !== undefined) contact.whatsapp = data.whatsapp;
    if (data.role !== undefined) contact.role = data.role;
    if (data.jobTitle !== undefined) contact.jobTitle = data.jobTitle;
    if (data.department !== undefined) contact.department = data.department;
    if (data.lifecycleStage !== undefined)
      contact.lifecycleStage = data.lifecycleStage;
    if (data.leadScore !== undefined) contact.leadScore = data.leadScore;
    if (data.leadTemperature !== undefined)
      contact.leadTemperature = data.leadTemperature;
    if (data.source !== undefined) contact.source = data.source;
    if (data.lastInteractionAt !== undefined)
      contact.lastInteractionAt = data.lastInteractionAt;
    if (data.lastChannelUsed !== undefined)
      contact.lastChannelUsed = data.lastChannelUsed;
    if (data.socialProfiles !== undefined)
      contact.socialProfiles = data.socialProfiles;
    if (data.tags !== undefined) contact.tags = data.tags;
    if (data.customFields !== undefined)
      contact.customFields = data.customFields;
    if (data.avatarUrl !== undefined) contact.avatarUrl = data.avatarUrl;
    if (data.assignedToUserId !== undefined)
      contact.assignedToUserId = data.assignedToUserId
        ? new UniqueEntityID(data.assignedToUserId)
        : undefined;
    if (data.isMainContact !== undefined)
      contact.isMainContact = data.isMainContact;

    return contact;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const contact = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (contact) {
      contact.delete();
    }
  }

  async count(tenantId: string): Promise<number> {
    return this.activeByTenant(tenantId).length;
  }
}
