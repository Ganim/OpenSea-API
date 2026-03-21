import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Contact } from '@/entities/sales/contact';
import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import type { ContactsRepository } from '@/repositories/sales/contacts-repository';

interface UpdateContactUseCaseRequest {
  id: string;
  tenantId: string;
  firstName?: string;
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

interface UpdateContactUseCaseResponse {
  contact: Contact;
}

export class UpdateContactUseCase {
  constructor(private contactsRepository: ContactsRepository) {}

  async execute(
    request: UpdateContactUseCaseRequest,
  ): Promise<UpdateContactUseCaseResponse> {
    const { id, tenantId, role, lifecycleStage, ...rest } = request;

    let contactRole: ContactRole | undefined;
    if (role !== undefined) {
      try {
        contactRole = ContactRole.create(role);
      } catch {
        throw new BadRequestError(
          `Invalid role: "${role}". Valid values: DECISION_MAKER, INFLUENCER, CHAMPION, GATEKEEPER, END_USER, OTHER`,
        );
      }
    }

    let stage: LifecycleStage | undefined;
    if (lifecycleStage !== undefined) {
      try {
        stage = LifecycleStage.create(lifecycleStage);
      } catch {
        throw new BadRequestError(
          `Invalid lifecycle stage: "${lifecycleStage}". Valid values: SUBSCRIBER, LEAD, QUALIFIED, OPPORTUNITY, CUSTOMER, EVANGELIST`,
        );
      }
    }

    const contact = await this.contactsRepository.update({
      id: new UniqueEntityID(id),
      tenantId,
      firstName: rest.firstName,
      lastName: rest.lastName,
      email: rest.email,
      phone: rest.phone,
      whatsapp: rest.whatsapp,
      role: contactRole,
      jobTitle: rest.jobTitle,
      department: rest.department,
      lifecycleStage: stage,
      leadScore: rest.leadScore,
      leadTemperature: rest.leadTemperature,
      source: rest.source,
      lastInteractionAt: rest.lastInteractionAt,
      lastChannelUsed: rest.lastChannelUsed,
      socialProfiles: rest.socialProfiles,
      tags: rest.tags,
      customFields: rest.customFields,
      avatarUrl: rest.avatarUrl,
      assignedToUserId: rest.assignedToUserId,
      isMainContact: rest.isMainContact,
    });

    if (!contact) {
      throw new ResourceNotFoundError('Contact not found');
    }

    return { contact };
  }
}
