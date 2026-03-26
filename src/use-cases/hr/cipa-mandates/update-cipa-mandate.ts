import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMandate } from '@/entities/hr/cipa-mandate';
import { CipaMandatesRepository } from '@/repositories/hr/cipa-mandates-repository';

export interface UpdateCipaMandateRequest {
  tenantId: string;
  mandateId: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  electionDate?: Date;
  notes?: string;
}

export interface UpdateCipaMandateResponse {
  cipaMandate: CipaMandate;
}

export class UpdateCipaMandateUseCase {
  constructor(private cipaMandatesRepository: CipaMandatesRepository) {}

  async execute(
    request: UpdateCipaMandateRequest,
  ): Promise<UpdateCipaMandateResponse> {
    const { tenantId, mandateId, ...data } = request;

    const existing = await this.cipaMandatesRepository.findById(
      new UniqueEntityID(mandateId),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Mandato CIPA não encontrado');
    }

    const cipaMandate = await this.cipaMandatesRepository.update({
      id: new UniqueEntityID(mandateId),
      name: data.name?.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      electionDate: data.electionDate,
      notes: data.notes?.trim(),
    });

    if (!cipaMandate) {
      throw new ResourceNotFoundError('Mandato CIPA não encontrado');
    }

    return { cipaMandate };
  }
}
