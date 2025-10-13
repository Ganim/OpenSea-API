import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { ListProductsUseCase } from '@/use-cases/stock/products/list-products';

export function makeListProductsUseCase() {
  const productsRepository = new PrismaProductsRepository();
  return new ListProductsUseCase(productsRepository);
}
