import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { DeleteProductUseCase } from '@/use-cases/stock/products/delete-product';

export function makeDeleteProductUseCase() {
  const productsRepository = new PrismaProductsRepository();
  return new DeleteProductUseCase(productsRepository);
}
