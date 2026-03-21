import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Contact } from '@/entities/sales/contact';
import type { ContactRole } from '@/entities/sales/value-objects/contact-role';
import type { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import type { PaginatedResult, PaginationParams } from '../pagination-params';

export interface CreateContactSchema {
  tenantId: string;
  customerId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  role: ContactRole;
  jobTitle?: string;
  department?: string;
  lifecycleStage?: LifecycleStage;
  leadScore?: number;
  leadTemperature?: string;
  source: string;
  lastInteractionAt?: Date;
  lastChannelUsed?: string;
  socialProfiles?: Record<string, unknown>;
  tags?: string[];
  customFields?: Record<string, unknown>;
  avatarUrl?: string;
  assignedToUserId?: string;
  isMainContact?: boolean;
}

export interface UpdateContactSchema {
  id: UniqueEntityID;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  role?: ContactRole;
  jobTitle?: string;
  department?: string;
  lifecycleStage?: LifecycleStage;
  leadScore?: number;
  leadTemperature?: string;
  source?: string;
  lastInteractionAt?: Date;
  lastChannelUsed?: string;
  socialProfiles?: Record<string, unknown>;
  tags?: string[];
  customFields?: Record<string, unknown>;
  avatarUrl?: string;
  assignedToUserId?: string;
  isMainContact?: boolean;
}

export interface FindManyContactsOptions extends PaginationParams {
  tenantId: string;
  search?: string;
  customerId?: string;
  lifecycleStage?: string;
  leadTemperature?: string;
  assignedToUserId?: string;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'leadScore' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ContactsRepository {
  create(data: CreateContactSchema): Promise<Contact>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Contact | null>;
  findByEmail(email: string, tenantId: string): Promise<Contact | null>;
  findByPhone(phone: string, tenantId: string): Promise<Contact | null>;
  findManyPaginated(
    options: FindManyContactsOptions,
  ): Promise<PaginatedResult<Contact>>;
  findManyByCustomer(
    customerId: UniqueEntityID,
    tenantId: string,
  ): Promise<Contact[]>;
  update(data: UpdateContactSchema): Promise<Contact | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  count(tenantId: string): Promise<number>;
}
