import pg from 'pg'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const { Pool } = pg

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })

async function main() {
  const testSchema = `test_schema_check`
  
  try {
    await pool.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`)
    await pool.query(`CREATE SCHEMA "${testSchema}"`)
    console.log(`✅ Schema ${testSchema} criado`)
    
    const databaseUrl = connectionString.replace(/schema=[^&]+/, `schema=${testSchema}`)
    
    console.log('\n🔧 Executando prisma db push...')
    try {
      execSync('npx prisma db push --force-reset', {
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
        stdio: 'pipe'
      })
      console.log('✅ db push executado')
    } catch (err) {
      console.log('⚠️ db push teve avisos mas continuou')
    }
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = '${testSchema}' 
        AND table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 Colunas criadas na tabela users:')
    console.table(result.rows)
    
    console.log('\n🔍 Analisando schema.prisma...')
    const schemaContent = readFileSync('prisma/schema.prisma', 'utf-8')
    
    const userModelMatch = schemaContent.match(/model User \{[\s\S]*?\n\}/)?.[0]
    if (userModelMatch) {
      const fields = userModelMatch.split('\n')
        .filter(line => line.trim() && !line.includes('model User') && !line.includes('@@') && !line.includes('}'))
        .map(line => line.trim().split(/\s+/)[0])
      
      console.log('Campos do schema:', fields.join(', '))
      
      const createdColumns = result.rows.map(r => r.column_name)
      const missingColumns = fields.filter(f => !createdColumns.includes(f))
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️ Colunas FALTANDO no banco:', missingColumns.join(', '))
      } else {
        console.log('\n✅ Todas as colunas foram criadas!')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await pool.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`)
    console.log('\n🧹 Schema de teste removido')
    await pool.end()
  }
}

main()
