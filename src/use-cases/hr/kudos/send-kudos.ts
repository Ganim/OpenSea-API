import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  EmployeeKudos,
  type KudosCategory,
} from '@/entities/hr/employee-kudos';
import type { EmployeeKudosRepository } from '@/repositories/hr/employee-kudos-repository';

const VALID_CATEGORIES: KudosCategory[] = [
  'TEAMWORK',
  'INNOVATION',
  'LEADERSHIP',
  'EXCELLENCE',
  'HELPFULNESS',
];

export interface SendKudosInput {
  tenantId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  message: string;
  category: string;
  isPublic?: boolean;
}

export interface SendKudosOutput {
  kudos: EmployeeKudos;
}

export class SendKudosUseCase {
  constructor(private employeeKudosRepository: EmployeeKudosRepository) {}

  async execute(input: SendKudosInput): Promise<SendKudosOutput> {
    const {
      tenantId,
      fromEmployeeId,
      toEmployeeId,
      message,
      category,
      isPublic = true,
    } = input;

    if (fromEmployeeId === toEmployeeId) {
      throw new BadRequestError('You cannot send kudos to yourself');
    }

    if (!message || message.trim().length === 0) {
      throw new BadRequestError('Kudos message is required');
    }

    if (!VALID_CATEGORIES.includes(category as KudosCategory)) {
      throw new BadRequestError(
        `Invalid category: ${category}. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
      );
    }

    const kudos = EmployeeKudos.create({
      tenantId: new UniqueEntityID(tenantId),
      fromEmployeeId: new UniqueEntityID(fromEmployeeId),
      toEmployeeId: new UniqueEntityID(toEmployeeId),
      message: message.trim(),
      category: category as KudosCategory,
      isPublic,
    });

    await this.employeeKudosRepository.create(kudos);

    return { kudos };
  }
}
