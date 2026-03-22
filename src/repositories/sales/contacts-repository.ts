import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Contact } from '@/entities/sales/contact';
import type { ContactRole } from '@/entities/sales/value-objects/contact-role';
import type { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import type { PaginatedResult } from '@/repositories/pagination-params';

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
  lifecycleStage: LifecycleStage;
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

export interface FindManyPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  customerId?: string;
  lifecycleStage?: string;
  leadTemperature?: string;
  assignedToUserId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContactsRepository {
  create(data: CreateContactSchema): Promise<Contact>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Contact | null>;
  findManyPaginated(
    params: FindManyPaginatedParams,
  ): Promise<PaginatedResult<Contact>>;
  update(data: UpdateContactSchema): Promise<Contact | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
