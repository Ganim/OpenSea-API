import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { GetProductByIdUseCase } from '@/use-cases/stock/products/get-product-by-id';

export function makeGetProductByIdUseCase() {
  const productsRepository = new PrismaProductsRepository();
  return new GetProductByIdUseCase(productsRepository);
}
