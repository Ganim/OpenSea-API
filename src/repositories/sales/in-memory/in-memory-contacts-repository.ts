import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Contact } from '@/entities/sales/contact';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  ContactsRepository,
  CreateContactSchema,
  FindManyPaginatedParams,
  UpdateContactSchema,
} from '@/repositories/sales/contacts-repository';

export class InMemoryContactsRepository implements ContactsRepository {
  public items: Contact[] = [];

  async create(data: CreateContactSchema): Promise<Contact> {
    const contact = Contact.create({
      tenantId: new UniqueEntityID(data.tenantId),
      customerId: new UniqueEntityID(data.customerId),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      role: data.role,
      jobTitle: data.jobTitle,
      department: data.department,
      lifecycleStage: data.lifecycleStage,
      leadScore: data.leadScore,
      leadTemperature: data.leadTemperature,
      source: data.source ?? 'MANUAL',
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
    return (
      this.items.find(
        (c) =>
          c.id.toString() === id.toString() &&
          c.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyPaginatedParams,
  ): Promise<PaginatedResult<Contact>> {
    let filtered = this.items.filter(
      (c) => c.tenantId.toString() === params.tenantId && !c.deletedAt,
    );

    if (params.customerId) {
      filtered = filtered.filter(
        (c) => c.customerId.toString() === params.customerId,
      );
    }

    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(s) ||
          (c.lastName?.toLowerCase().includes(s) ?? false) ||
          (c.email?.toLowerCase().includes(s) ?? false),
      );
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async update(data: UpdateContactSchema): Promise<Contact | null> {
    const index = this.items.findIndex(
      (c) =>
        c.id.toString() === data.id.toString() &&
        c.tenantId.toString() === data.tenantId,
    );

    if (index === -1) return null;

    const contact = this.items[index]!;
    if (data.firstName !== undefined) contact.firstName = data.firstName;
    if (data.lastName !== undefined) contact.lastName = data.lastName;
    if (data.email !== undefined) contact.email = data.email;
    if (data.phone !== undefined) contact.phone = data.phone;
    if (data.role !== undefined) contact.role = data.role;
    if (data.lifecycleStage !== undefined)
      contact.lifecycleStage = data.lifecycleStage;
    if (data.leadScore !== undefined) contact.leadScore = data.leadScore;

    return contact;
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const index = this.items.findIndex(
      (c) => c.id.toString() === id.toString(),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
