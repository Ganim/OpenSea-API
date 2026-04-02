import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { CipaMandate } from '@/entities/hr/cipa-mandate';
import { CipaMandatesRepository } from '@/repositories/hr/cipa-mandates-repository';

export interface CreateCipaMandateRequest {
  tenantId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status?: string;
  electionDate?: Date;
  notes?: string;
}

export interface CreateCipaMandateResponse {
  cipaMandate: CipaMandate;
}

export class CreateCipaMandateUseCase {
  constructor(private cipaMandatesRepository: CipaMandatesRepository) {}

  async execute(
    request: CreateCipaMandateRequest,
  ): Promise<CreateCipaMandateResponse> {
    const { tenantId, name, startDate, endDate, status, electionDate, notes } =
      request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('O nome do mandato é obrigatório');
    }

    if (endDate <= startDate) {
      throw new BadRequestError(
        'A data de término deve ser posterior à data de início',
      );
    }

    const cipaMandate = await this.cipaMandatesRepository.create({
      tenantId,
      name: name.trim(),
      startDate,
      endDate,
      status,
      electionDate,
      notes: notes?.trim(),
    });

    return { cipaMandate };
  }
}
