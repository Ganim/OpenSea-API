import { Variant } from '@/entities/stock/variant';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface ListVariantsUseCaseInput {
  tenantId: string;
}

export class ListVariantsUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute(input: ListVariantsUseCaseInput): Promise<Variant[]> {
    const { tenantId } = input;

    const variants = await this.variantsRepository.findMany(tenantId);

    return variants;
  }
}
