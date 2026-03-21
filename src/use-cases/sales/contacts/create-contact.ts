import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Contact } from '@/entities/sales/contact';
import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import type { ContactsRepository } from '@/repositories/sales/contacts-repository';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';

interface CreateContactUseCaseRequest {
  tenantId: string;
  customerId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  role?: string;
  jobTitle?: string;
  department?: string;
  lifecycleStage?: string;
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

interface CreateContactUseCaseResponse {
  contact: Contact;
}

export class CreateContactUseCase {
  constructor(
    private contactsRepository: ContactsRepository,
    private customersRepository: CustomersRepository,
  ) {}

  async execute(
    request: CreateContactUseCaseRequest,
  ): Promise<CreateContactUseCaseResponse> {
    const { tenantId, customerId, firstName, role, lifecycleStage } = request;

    if (!firstName || firstName.trim().length === 0) {
      throw new BadRequestError('First name is required');
    }

    const customer = await this.customersRepository.findById(
      new UniqueEntityID(customerId),
      tenantId,
    );
    if (!customer) {
      throw new ResourceNotFoundError('Customer not found');
    }

    let contactRole: ContactRole;
    try {
      contactRole = ContactRole.create(role ?? 'OTHER');
    } catch {
      throw new BadRequestError(
        `Invalid role: "${role}". Valid values: DECISION_MAKER, INFLUENCER, CHAMPION, GATEKEEPER, END_USER, OTHER`,
      );
    }

    let stage: LifecycleStage;
    try {
      stage = LifecycleStage.create(lifecycleStage ?? 'LEAD');
    } catch {
      throw new BadRequestError(
        `Invalid lifecycle stage: "${lifecycleStage}". Valid values: SUBSCRIBER, LEAD, QUALIFIED, OPPORTUNITY, CUSTOMER, EVANGELIST`,
      );
    }

    const contact = await this.contactsRepository.create({
      tenantId,
      customerId,
      firstName: firstName.trim(),
      lastName: request.lastName,
      email: request.email,
      phone: request.phone,
      whatsapp: request.whatsapp,
      role: contactRole,
      jobTitle: request.jobTitle,
      department: request.department,
      lifecycleStage: stage,
      leadScore: request.leadScore,
      leadTemperature: request.leadTemperature,
      source: request.source ?? 'MANUAL',
      lastInteractionAt: request.lastInteractionAt,
      lastChannelUsed: request.lastChannelUsed,
      socialProfiles: request.socialProfiles,
      tags: request.tags,
      customFields: request.customFields,
      avatarUrl: request.avatarUrl,
      assignedToUserId: request.assignedToUserId,
      isMainContact: request.isMainContact,
    });

    return { contact };
  }
}
