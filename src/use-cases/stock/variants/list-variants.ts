import { Variant } from '@/entities/stock/variant';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export class ListVariantsUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute(): Promise<Variant[]> {
    const variants = await this.variantsRepository.findMany();

    return variants;
  }
}
