import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const products = await prisma.product.count();
const templates = await prisma.template.count();
const variants = await prisma.variant.count();
const users = await prisma.user.count();
const suppliers = await prisma.supplier.count();
const manufacturers = await prisma.manufacturer.count();

console.log('=== Main DB state (public schema) ===');
console.log('products:', products);
console.log('templates:', templates);
console.log('variants:', variants);
console.log('users:', users);
console.log('suppliers:', suppliers);
console.log('manufacturers:', manufacturers);

if (products > 0 || templates > 0 || variants > 0) {
  console.log('\n❌ CONTAMINATION DETECTED - test data leaked to main DB');
} else {
  console.log('\n✅ No contamination - main DB is clean');
}

await prisma.$disconnect();
