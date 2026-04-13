import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { JobCardsRepository } from '@/repositories/production/job-cards-repository';

interface CreateJobCardUseCaseRequest {
  productionOrderId: string;
  operationRoutingId: string;
  workstationId?: string;
  quantityPlanned: number;
  scheduledStart?: Date;
  scheduledEnd?: Date;
}

interface CreateJobCardUseCaseResponse {
  jobCard: import('@/entities/production/job-card').ProductionJobCard;
}

export class CreateJobCardUseCase {
  constructor(private jobCardsRepository: JobCardsRepository) {}

  async execute({
    productionOrderId,
    operationRoutingId,
    workstationId,
    quantityPlanned,
    scheduledStart,
    scheduledEnd,
  }: CreateJobCardUseCaseRequest): Promise<CreateJobCardUseCaseResponse> {
    if (quantityPlanned <= 0) {
      throw new BadRequestError('Quantity planned must be greater than zero.');
    }

    const barcode = `JC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const jobCard = await this.jobCardsRepository.create({
      productionOrderId,
      operationRoutingId,
      workstationId,
      quantityPlanned,
      scheduledStart,
      scheduledEnd,
      barcode,
    });

    return { jobCard };
  }
}
