import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './prisma/generated/prisma/client.js'

const testSchema = 'test_manual_check'
const connectionString = process.env.DATABASE_URL!.replace(/schema=[^&]+/, `schema=${testSchema}`)

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
})

async function test() {
  try {
    console.log('🔍 Tentando findFirst...')
    const user = await prisma.user.findFirst({
      where: { email: 'test@test.com' },
      include: { profile: true },
    })
    console.log('✅ Query executada:', user)
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
    if (error.meta) {
      console.error('Meta:', JSON.stringify(error.meta, null, 2))
    }
  } finally {
    await prisma.$disconnect()
  }
}

test()
