import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const __dirname = path.dirname(process.argv[1])
const prisma = new PrismaClient()

interface PermissionsConfig {
  version: string
  lastUpdated: string
  modules: Record<
    string,
    {
      description: string
      resources: Record<
        string,
        {
          description: string
          actions: string[]
        }
      >
    }
  >
}

/**
 * Sincroniza as permissões do arquivo JSON com o banco de dados
 *
 * Regras:
 * 1. Insere novas permissões que não existem
 * 2. Atualiza descrições de permissões existentes
 * 3. NÃO remove permissões (mantém histórico)
 * 4. Marca permissões não presentes no JSON com metadata.deprecated = true
 * 5. Mantém permissões customizadas (isSystem = false)
 */
export async function syncPermissions() {
  console.log('🔄 Starting permissions synchronization...\n')

  // Carrega o arquivo JSON
  const configPath = path.join(__dirname, 'permissions.json')
  const configFile = fs.readFileSync(configPath, 'utf-8')
  const config: PermissionsConfig = JSON.parse(configFile)

  console.log(`📦 Loaded permissions config version ${config.version}`)
  console.log(`📅 Last updated: ${config.lastUpdated}\n`)

  // Monta o conjunto de códigos esperados do JSON
  const expectedCodes = new Set<string>()
  const permissionsToUpsert: Array<{
    code: string
    name: string
    description: string
    module: string
    resource: string
    action: string
  }> = []

  // Processa cada módulo
  for (const [moduleName, moduleData] of Object.entries(config.modules)) {
    console.log(`📂 Processing module: ${moduleName}`)

    for (const [resourceName, resourceData] of Object.entries(
      moduleData.resources,
    )) {
      console.log(`  📄 Processing resource: ${resourceName}`)

      for (const action of resourceData.actions) {
        const code = `${moduleName.toLowerCase()}.${resourceName}.${action}`
        expectedCodes.add(code)

        const name = `${action.charAt(0).toUpperCase()}${action.slice(1)} ${resourceName
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')}`

        const description = `${resourceData.description} - ${action} action`

        permissionsToUpsert.push({
          code,
          name,
          description,
          module: moduleName.toLowerCase(),
          resource: resourceName,
          action,
        })
      }
    }
  }

  console.log(
    `\n✅ Found ${permissionsToUpsert.length} permissions in JSON file\n`,
  )

  // Busca todas as permissões do sistema no banco
  const existingPermissions = await prisma.permission.findMany({
    where: {
      isSystem: true,
    },
  })

  console.log(
    `📊 Found ${existingPermissions.length} system permissions in database\n`,
  )

  // Estatísticas
  let inserted = 0
  let updated = 0
  let deprecated = 0
  let unchanged = 0

  // Insere ou atualiza permissões do JSON
  for (const perm of permissionsToUpsert) {
    const existing = existingPermissions.find((p) => p.code === perm.code)

    if (!existing) {
      // Insere nova permissão
      await prisma.permission.create({
        data: {
          code: perm.code,
          name: perm.name,
          description: perm.description,
          module: perm.module,
          resource: perm.resource,
          action: perm.action,
          isSystem: true,
          metadata: {
            source: 'permissions.json',
            version: config.version,
            addedAt: new Date().toISOString(),
          },
        },
      })
      console.log(`  ➕ Inserted: ${perm.code}`)
      inserted++
    } else {
      // Atualiza descrição e remove flag deprecated se existir
      const currentMetadata = existing.metadata as Record<string, unknown>
      const wasDeprecated = currentMetadata?.deprecated === true

      await prisma.permission.update({
        where: { id: existing.id },
        data: {
          name: perm.name,
          description: perm.description,
          metadata: {
            ...(currentMetadata || {}),
            source: 'permissions.json',
            version: config.version,
            deprecated: false,
            updatedAt: new Date().toISOString(),
            ...(wasDeprecated
              ? { restoredAt: new Date().toISOString() }
              : {}),
          },
        },
      })

      if (wasDeprecated) {
        console.log(`  ♻️  Restored: ${perm.code}`)
        updated++
      } else {
        unchanged++
      }
    }
  }

  // Marca permissões não presentes no JSON como deprecated
  for (const existing of existingPermissions) {
    if (!expectedCodes.has(existing.code)) {
      const currentMetadata = existing.metadata as Record<string, unknown>
      const alreadyDeprecated = currentMetadata?.deprecated === true

      if (!alreadyDeprecated) {
        // Remove associações com grupos de permissão antes de deprecar
        await prisma.permissionGroupPermission.deleteMany({
          where: { permissionId: existing.id },
        })

        // Remove permissões diretas de usuários
        await prisma.userDirectPermission.deleteMany({
          where: { permissionId: existing.id },
        })

        // Marca como deprecated
        await prisma.permission.update({
          where: { id: existing.id },
          data: {
            metadata: {
              ...(currentMetadata || {}),
              deprecated: true,
              deprecatedAt: new Date().toISOString(),
              reason: 'Not found in permissions.json',
            },
          },
        })
        console.log(`  ⚠️  Deprecated: ${existing.code}`)
        deprecated++
      }
    }
  }

  // =====================================================
  // Atualizar Admin Group com novas permissões
  // =====================================================
  console.log('\n🔐 Updating Admin Group with all system permissions...')

  const adminGroup = await prisma.permissionGroup.findFirst({
    where: { slug: 'admin', deletedAt: null },
  })

  if (adminGroup) {
    const allCurrentPermissions = await prisma.permission.findMany({
      where: {
        isSystem: true,
        NOT: {
          metadata: {
            path: ['deprecated'],
            equals: true,
          },
        },
      },
    })

    for (const permission of allCurrentPermissions) {
      await prisma.permissionGroupPermission.upsert({
        where: {
          groupId_permissionId: {
            groupId: adminGroup.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          groupId: adminGroup.id,
          permissionId: permission.id,
          effect: 'allow',
        },
      })
    }

    console.log(`✅ Admin Group synchronized with ${allCurrentPermissions.length} permissions\n`)
  }

  // Relatório final
  console.log('\n' + '='.repeat(60))
  console.log('📊 SYNCHRONIZATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Inserted:   ${inserted} new permissions`)
  console.log(`♻️  Restored:   ${updated} deprecated permissions`)
  console.log(`⚠️  Deprecated: ${deprecated} permissions`)
  console.log(`➖ Unchanged:  ${unchanged} permissions`)
  console.log('='.repeat(60))
  console.log(
    `\n✨ Synchronization completed successfully! Total in database: ${existingPermissions.length + inserted}\n`,
  )
}

// Executa se for chamado diretamente
const isMainModule = process.argv[1]?.includes('sync-permissions')

if (isMainModule) {
  syncPermissions()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error during synchronization:', error)
      process.exit(1)
    })
    .finally(() => {
      prisma.$disconnect()
    })
}
