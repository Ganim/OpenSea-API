import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed do Sistema RBAC
 *
 * Este script popula o banco de dados com:
 * 1. Permissões básicas para todos os módulos (Core, Stock, Sales)
 * 2. Grupos de permissões (Admin, Manager, User)
 * 3. Usuário administrador padrão (admin@teste.com)
 * 4. Atribuição automática de grupos aos usuários existentes
 *
 * NOTA: A coluna `role` no modelo User está DEPRECATED.
 * Use Permission Groups para controle de acesso.
 */

interface PermissionSeed {
  code: string;
  name: string;
  description: string;
  module: string;
  resource: string;
  action: string;
}

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // =============================================
  // 0. LIMPEZA - Remover permissões inválidas
  // =============================================

  console.log('🧹 Removendo permissões inválidas...');

  // Remover permissões com código inválido (contém underscores ou maiúsculas)
  const invalidPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { code: { contains: '_' } },
        { code: { contains: 'A' } },
        { code: { contains: 'B' } },
        { code: { contains: 'C' } },
        { code: { contains: 'D' } },
        { code: { contains: 'E' } },
        { code: { contains: 'F' } },
        { code: { contains: 'G' } },
        { code: { contains: 'H' } },
        { code: { contains: 'I' } },
        { code: { contains: 'J' } },
        { code: { contains: 'K' } },
        { code: { contains: 'L' } },
        { code: { contains: 'M' } },
        { code: { contains: 'N' } },
        { code: { contains: 'O' } },
        { code: { contains: 'P' } },
        { code: { contains: 'Q' } },
        { code: { contains: 'R' } },
        { code: { contains: 'S' } },
        { code: { contains: 'T' } },
        { code: { contains: 'U' } },
        { code: { contains: 'V' } },
        { code: { contains: 'W' } },
        { code: { contains: 'X' } },
        { code: { contains: 'Y' } },
        { code: { contains: 'Z' } },
      ],
    },
  });

  if (invalidPermissions.length > 0) {
    console.log(
      `⚠️  Encontradas ${invalidPermissions.length} permissões com código inválido:`,
    );
    for (const perm of invalidPermissions) {
      console.log(`   - ${perm.code}`);
      // Remover associações
      await prisma.permissionGroupPermission.deleteMany({
        where: { permissionId: perm.id },
      });
      // Remover a permissão
      await prisma.permission.delete({
        where: { id: perm.id },
      });
    }
    console.log('✅ Permissões inválidas removidas\n');
  }

  // =============================================
  // 1. CRIAR PERMISSÕES
  // =============================================

  console.log('📝 Criando permissões...');

  const permissions: PermissionSeed[] = [
    // ==================== CORE MODULE ====================
    // Users
    {
      code: 'core.users.create',
      name: 'Criar Usuário',
      description: 'Permite criar novos usuários no sistema',
      module: 'core',
      resource: 'users',
      action: 'create',
    },
    {
      code: 'core.users.read',
      name: 'Ler Usuário',
      description: 'Permite visualizar informações de usuários',
      module: 'core',
      resource: 'users',
      action: 'read',
    },
    {
      code: 'core.users.update',
      name: 'Atualizar Usuário',
      description: 'Permite atualizar informações de usuários',
      module: 'core',
      resource: 'users',
      action: 'update',
    },
    {
      code: 'core.users.delete',
      name: 'Deletar Usuário',
      description: 'Permite deletar usuários do sistema',
      module: 'core',
      resource: 'users',
      action: 'delete',
    },
    {
      code: 'core.users.list',
      name: 'Listar Usuários',
      description: 'Permite listar todos os usuários',
      module: 'core',
      resource: 'users',
      action: 'list',
    },
    {
      code: 'core.users.manage',
      name: 'Gerenciar Usuários',
      description: 'Acesso completo ao gerenciamento de usuários',
      module: 'core',
      resource: 'users',
      action: 'manage',
    },

    // Sessions
    {
      code: 'core.sessions.read',
      name: 'Ler Sessões',
      description: 'Permite visualizar sessões ativas',
      module: 'core',
      resource: 'sessions',
      action: 'read',
    },
    {
      code: 'core.sessions.delete',
      name: 'Revogar Sessão',
      description: 'Permite revogar sessões de usuários',
      module: 'core',
      resource: 'sessions',
      action: 'delete',
    },
    {
      code: 'core.sessions.list',
      name: 'Listar Sessões',
      description: 'Permite listar todas as sessões',
      module: 'core',
      resource: 'sessions',
      action: 'list',
    },

    // Profiles
    {
      code: 'core.profiles.read',
      name: 'Ler Perfil',
      description: 'Permite visualizar perfis de usuários',
      module: 'core',
      resource: 'profiles',
      action: 'read',
    },
    {
      code: 'core.profiles.update',
      name: 'Atualizar Perfil',
      description: 'Permite atualizar perfis de usuários',
      module: 'core',
      resource: 'profiles',
      action: 'update',
    },

    // ==================== STOCK MODULE ====================
    // Products
    {
      code: 'stock.products.create',
      name: 'Criar Produto',
      description: 'Permite criar novos produtos',
      module: 'stock',
      resource: 'products',
      action: 'create',
    },
    {
      code: 'stock.products.read',
      name: 'Ler Produto',
      description: 'Permite visualizar informações de produtos',
      module: 'stock',
      resource: 'products',
      action: 'read',
    },
    {
      code: 'stock.products.update',
      name: 'Atualizar Produto',
      description: 'Permite atualizar informações de produtos',
      module: 'stock',
      resource: 'products',
      action: 'update',
    },
    {
      code: 'stock.products.delete',
      name: 'Deletar Produto',
      description: 'Permite deletar produtos',
      module: 'stock',
      resource: 'products',
      action: 'delete',
    },
    {
      code: 'stock.products.list',
      name: 'Listar Produtos',
      description: 'Permite listar todos os produtos',
      module: 'stock',
      resource: 'products',
      action: 'list',
    },
    {
      code: 'stock.products.request',
      name: 'Solicitar Produto',
      description: 'Permite abrir solicitações relacionadas a produtos',
      module: 'stock',
      resource: 'products',
      action: 'request',
    },
    {
      code: 'stock.products.approve',
      name: 'Aprovar Produto',
      description: 'Permite aprovar solicitações de produtos',
      module: 'stock',
      resource: 'products',
      action: 'approve',
    },
    {
      code: 'stock.products.manage',
      name: 'Gerenciar Produtos',
      description: 'Acesso completo ao gerenciamento de produtos',
      module: 'stock',
      resource: 'products',
      action: 'manage',
    },

    // Variants
    {
      code: 'stock.variants.create',
      name: 'Criar Variante',
      description: 'Permite criar novas variantes de produtos',
      module: 'stock',
      resource: 'variants',
      action: 'create',
    },
    {
      code: 'stock.variants.read',
      name: 'Ler Variante',
      description: 'Permite visualizar variantes de produtos',
      module: 'stock',
      resource: 'variants',
      action: 'read',
    },
    {
      code: 'stock.variants.update',
      name: 'Atualizar Variante',
      description: 'Permite atualizar variantes de produtos',
      module: 'stock',
      resource: 'variants',
      action: 'update',
    },
    {
      code: 'stock.variants.delete',
      name: 'Deletar Variante',
      description: 'Permite deletar variantes de produtos',
      module: 'stock',
      resource: 'variants',
      action: 'delete',
    },
    {
      code: 'stock.variants.list',
      name: 'Listar Variantes',
      description: 'Permite listar todas as variantes',
      module: 'stock',
      resource: 'variants',
      action: 'list',
    },
    {
      code: 'stock.variants.request',
      name: 'Solicitar Variante',
      description: 'Permite abrir solicitações relacionadas a variantes',
      module: 'stock',
      resource: 'variants',
      action: 'request',
    },
    {
      code: 'stock.variants.approve',
      name: 'Aprovar Variante',
      description: 'Permite aprovar solicitações de variantes',
      module: 'stock',
      resource: 'variants',
      action: 'approve',
    },
    {
      code: 'stock.variants.manage',
      name: 'Gerenciar Variantes',
      description: 'Acesso completo ao gerenciamento de variantes',
      module: 'stock',
      resource: 'variants',
      action: 'manage',
    },

    // Items
    {
      code: 'stock.items.create',
      name: 'Criar Item',
      description: 'Permite criar novos itens de estoque',
      module: 'stock',
      resource: 'items',
      action: 'create',
    },
    {
      code: 'stock.items.read',
      name: 'Ler Item',
      description: 'Permite visualizar itens de estoque',
      module: 'stock',
      resource: 'items',
      action: 'read',
    },
    {
      code: 'stock.items.update',
      name: 'Atualizar Item',
      description: 'Permite atualizar itens de estoque',
      module: 'stock',
      resource: 'items',
      action: 'update',
    },
    {
      code: 'stock.items.delete',
      name: 'Deletar Item',
      description: 'Permite deletar itens de estoque',
      module: 'stock',
      resource: 'items',
      action: 'delete',
    },
    {
      code: 'stock.items.list',
      name: 'Listar Itens',
      description: 'Permite listar todos os itens de estoque',
      module: 'stock',
      resource: 'items',
      action: 'list',
    },
    {
      code: 'stock.items.request',
      name: 'Solicitar Item',
      description: 'Permite abrir solicitações relacionadas a itens',
      module: 'stock',
      resource: 'items',
      action: 'request',
    },
    {
      code: 'stock.items.approve',
      name: 'Aprovar Item',
      description: 'Permite aprovar solicitações de itens',
      module: 'stock',
      resource: 'items',
      action: 'approve',
    },
    {
      code: 'stock.items.manage',
      name: 'Gerenciar Itens',
      description: 'Acesso completo ao gerenciamento de itens',
      module: 'stock',
      resource: 'items',
      action: 'manage',
    },

    // Movements
    {
      code: 'stock.movements.create',
      name: 'Criar Movimentação',
      description: 'Permite criar movimentações de estoque',
      module: 'stock',
      resource: 'movements',
      action: 'create',
    },
    {
      code: 'stock.movements.read',
      name: 'Ler Movimentação',
      description: 'Permite visualizar movimentações de estoque',
      module: 'stock',
      resource: 'movements',
      action: 'read',
    },
    {
      code: 'stock.movements.list',
      name: 'Listar Movimentações',
      description: 'Permite listar todas as movimentações',
      module: 'stock',
      resource: 'movements',
      action: 'list',
    },
    {
      code: 'stock.movements.approve',
      name: 'Aprovar Movimentação',
      description: 'Permite aprovar movimentações de estoque',
      module: 'stock',
      resource: 'movements',
      action: 'approve',
    },

    // Suppliers
    {
      code: 'stock.suppliers.create',
      name: 'Criar Fornecedor',
      description: 'Permite criar novos fornecedores',
      module: 'stock',
      resource: 'suppliers',
      action: 'create',
    },
    {
      code: 'stock.suppliers.read',
      name: 'Ler Fornecedor',
      description: 'Permite visualizar fornecedores',
      module: 'stock',
      resource: 'suppliers',
      action: 'read',
    },
    {
      code: 'stock.suppliers.update',
      name: 'Atualizar Fornecedor',
      description: 'Permite atualizar fornecedores',
      module: 'stock',
      resource: 'suppliers',
      action: 'update',
    },
    {
      code: 'stock.suppliers.delete',
      name: 'Deletar Fornecedor',
      description: 'Permite deletar fornecedores',
      module: 'stock',
      resource: 'suppliers',
      action: 'delete',
    },
    {
      code: 'stock.suppliers.list',
      name: 'Listar Fornecedores',
      description: 'Permite listar todos os fornecedores',
      module: 'stock',
      resource: 'suppliers',
      action: 'list',
    },
    {
      code: 'stock.suppliers.manage',
      name: 'Gerenciar Fornecedores',
      description: 'Acesso completo ao gerenciamento de fornecedores',
      module: 'stock',
      resource: 'suppliers',
      action: 'manage',
    },

    // Manufacturers
    {
      code: 'stock.manufacturers.create',
      name: 'Criar Fabricante',
      description: 'Permite criar novos fabricantes',
      module: 'stock',
      resource: 'manufacturers',
      action: 'create',
    },
    {
      code: 'stock.manufacturers.read',
      name: 'Ler Fabricante',
      description: 'Permite visualizar fabricantes',
      module: 'stock',
      resource: 'manufacturers',
      action: 'read',
    },
    {
      code: 'stock.manufacturers.update',
      name: 'Atualizar Fabricante',
      description: 'Permite atualizar fabricantes',
      module: 'stock',
      resource: 'manufacturers',
      action: 'update',
    },
    {
      code: 'stock.manufacturers.delete',
      name: 'Deletar Fabricante',
      description: 'Permite deletar fabricantes',
      module: 'stock',
      resource: 'manufacturers',
      action: 'delete',
    },
    {
      code: 'stock.manufacturers.list',
      name: 'Listar Fabricantes',
      description: 'Permite listar todos os fabricantes',
      module: 'stock',
      resource: 'manufacturers',
      action: 'list',
    },
    {
      code: 'stock.manufacturers.manage',
      name: 'Gerenciar Fabricantes',
      description: 'Acesso completo ao gerenciamento de fabricantes',
      module: 'stock',
      resource: 'manufacturers',
      action: 'manage',
    },

    // Locations
    {
      code: 'stock.locations.create',
      name: 'Criar Localização',
      description: 'Permite criar novas localizações',
      module: 'stock',
      resource: 'locations',
      action: 'create',
    },
    {
      code: 'stock.locations.read',
      name: 'Ler Localização',
      description: 'Permite visualizar localizações',
      module: 'stock',
      resource: 'locations',
      action: 'read',
    },
    {
      code: 'stock.locations.update',
      name: 'Atualizar Localização',
      description: 'Permite atualizar localizações',
      module: 'stock',
      resource: 'locations',
      action: 'update',
    },
    {
      code: 'stock.locations.delete',
      name: 'Deletar Localização',
      description: 'Permite deletar localizações',
      module: 'stock',
      resource: 'locations',
      action: 'delete',
    },
    {
      code: 'stock.locations.list',
      name: 'Listar Localizações',
      description: 'Permite listar todas as localizações',
      module: 'stock',
      resource: 'locations',
      action: 'list',
    },
    {
      code: 'stock.locations.manage',
      name: 'Gerenciar Localizações',
      description: 'Acesso completo ao gerenciamento de localizações',
      module: 'stock',
      resource: 'locations',
      action: 'manage',
    },

    // Categories
    {
      code: 'stock.categories.create',
      name: 'Criar Categoria',
      description: 'Permite criar novas categorias',
      module: 'stock',
      resource: 'categories',
      action: 'create',
    },
    {
      code: 'stock.categories.read',
      name: 'Ler Categoria',
      description: 'Permite visualizar categorias',
      module: 'stock',
      resource: 'categories',
      action: 'read',
    },
    {
      code: 'stock.categories.update',
      name: 'Atualizar Categoria',
      description: 'Permite atualizar categorias',
      module: 'stock',
      resource: 'categories',
      action: 'update',
    },
    {
      code: 'stock.categories.delete',
      name: 'Deletar Categoria',
      description: 'Permite deletar categorias',
      module: 'stock',
      resource: 'categories',
      action: 'delete',
    },
    {
      code: 'stock.categories.list',
      name: 'Listar Categorias',
      description: 'Permite listar todas as categorias',
      module: 'stock',
      resource: 'categories',
      action: 'list',
    },
    {
      code: 'stock.categories.manage',
      name: 'Gerenciar Categorias',
      description: 'Acesso completo ao gerenciamento de categorias',
      module: 'stock',
      resource: 'categories',
      action: 'manage',
    },

    // Tags
    {
      code: 'stock.tags.create',
      name: 'Criar Tag',
      description: 'Permite criar novas tags',
      module: 'stock',
      resource: 'tags',
      action: 'create',
    },
    {
      code: 'stock.tags.read',
      name: 'Ler Tag',
      description: 'Permite visualizar tags',
      module: 'stock',
      resource: 'tags',
      action: 'read',
    },
    {
      code: 'stock.tags.update',
      name: 'Atualizar Tag',
      description: 'Permite atualizar tags',
      module: 'stock',
      resource: 'tags',
      action: 'update',
    },
    {
      code: 'stock.tags.delete',
      name: 'Deletar Tag',
      description: 'Permite deletar tags',
      module: 'stock',
      resource: 'tags',
      action: 'delete',
    },
    {
      code: 'stock.tags.list',
      name: 'Listar Tags',
      description: 'Permite listar todas as tags',
      module: 'stock',
      resource: 'tags',
      action: 'list',
    },
    {
      code: 'stock.tags.manage',
      name: 'Gerenciar Tags',
      description: 'Acesso completo ao gerenciamento de tags',
      module: 'stock',
      resource: 'tags',
      action: 'manage',
    },

    // Templates
    {
      code: 'stock.templates.create',
      name: 'Criar Template',
      description: 'Permite criar novos templates',
      module: 'stock',
      resource: 'templates',
      action: 'create',
    },
    {
      code: 'stock.templates.read',
      name: 'Ler Template',
      description: 'Permite visualizar templates',
      module: 'stock',
      resource: 'templates',
      action: 'read',
    },
    {
      code: 'stock.templates.update',
      name: 'Atualizar Template',
      description: 'Permite atualizar templates',
      module: 'stock',
      resource: 'templates',
      action: 'update',
    },
    {
      code: 'stock.templates.delete',
      name: 'Deletar Template',
      description: 'Permite deletar templates',
      module: 'stock',
      resource: 'templates',
      action: 'delete',
    },
    {
      code: 'stock.templates.list',
      name: 'Listar Templates',
      description: 'Permite listar todos os templates',
      module: 'stock',
      resource: 'templates',
      action: 'list',
    },
    {
      code: 'stock.templates.manage',
      name: 'Gerenciar Templates',
      description: 'Acesso completo ao gerenciamento de templates',
      module: 'stock',
      resource: 'templates',
      action: 'manage',
    },

    // Purchase Orders
    {
      code: 'stock.purchase-orders.create',
      name: 'Criar Pedido de Compra',
      description: 'Permite criar novos pedidos de compra',
      module: 'stock',
      resource: 'purchase-orders',
      action: 'create',
    },
    {
      code: 'stock.purchase-orders.read',
      name: 'Ler Pedido de Compra',
      description: 'Permite visualizar pedidos de compra',
      module: 'stock',
      resource: 'purchase-orders',
      action: 'read',
    },
    {
      code: 'stock.purchase-orders.update',
      name: 'Atualizar Pedido de Compra',
      description: 'Permite atualizar pedidos de compra',
      module: 'stock',
      resource: 'purchase-orders',
      action: 'update',
    },
    {
      code: 'stock.purchase-orders.delete',
      name: 'Deletar Pedido de Compra',
      description: 'Permite deletar pedidos de compra',
      module: 'stock',
      resource: 'purchase-orders',
      action: 'delete',
    },
    {
      code: 'stock.purchase-orders.list',
      name: 'Listar Pedidos de Compra',
      description: 'Permite listar todos os pedidos de compra',
      module: 'stock',
      resource: 'purchase-orders',
      action: 'list',
    },
    {
      code: 'stock.purchase-orders.approve',
      name: 'Aprovar Pedido de Compra',
      description: 'Permite aprovar pedidos de compra',
      module: 'stock',
      resource: 'purchase-orders',
      action: 'approve',
    },
    {
      code: 'stock.purchase-orders.manage',
      name: 'Gerenciar Pedidos de Compra',
      description: 'Acesso completo ao gerenciamento de pedidos de compra',
      module: 'stock',
      resource: 'purchase-orders',
      action: 'manage',
    },

    // ==================== SALES MODULE ====================
    // Customers
    {
      code: 'sales.customers.create',
      name: 'Criar Cliente',
      description: 'Permite criar novos clientes',
      module: 'sales',
      resource: 'customers',
      action: 'create',
    },
    {
      code: 'sales.customers.read',
      name: 'Ler Cliente',
      description: 'Permite visualizar clientes',
      module: 'sales',
      resource: 'customers',
      action: 'read',
    },
    {
      code: 'sales.customers.update',
      name: 'Atualizar Cliente',
      description: 'Permite atualizar clientes',
      module: 'sales',
      resource: 'customers',
      action: 'update',
    },
    {
      code: 'sales.customers.delete',
      name: 'Deletar Cliente',
      description: 'Permite deletar clientes',
      module: 'sales',
      resource: 'customers',
      action: 'delete',
    },
    {
      code: 'sales.customers.list',
      name: 'Listar Clientes',
      description: 'Permite listar todos os clientes',
      module: 'sales',
      resource: 'customers',
      action: 'list',
    },
    {
      code: 'sales.customers.manage',
      name: 'Gerenciar Clientes',
      description: 'Acesso completo ao gerenciamento de clientes',
      module: 'sales',
      resource: 'customers',
      action: 'manage',
    },

    // Sales Orders
    {
      code: 'sales.orders.create',
      name: 'Criar Pedido de Venda',
      description: 'Permite criar novos pedidos de venda',
      module: 'sales',
      resource: 'orders',
      action: 'create',
    },
    {
      code: 'sales.orders.read',
      name: 'Ler Pedido de Venda',
      description: 'Permite visualizar pedidos de venda',
      module: 'sales',
      resource: 'orders',
      action: 'read',
    },
    {
      code: 'sales.orders.update',
      name: 'Atualizar Pedido de Venda',
      description: 'Permite atualizar pedidos de venda',
      module: 'sales',
      resource: 'orders',
      action: 'update',
    },
    {
      code: 'sales.orders.delete',
      name: 'Deletar Pedido de Venda',
      description: 'Permite deletar pedidos de venda',
      module: 'sales',
      resource: 'orders',
      action: 'delete',
    },
    {
      code: 'sales.orders.list',
      name: 'Listar Pedidos de Venda',
      description: 'Permite listar todos os pedidos de venda',
      module: 'sales',
      resource: 'orders',
      action: 'list',
    },
    {
      code: 'sales.orders.request',
      name: 'Solicitar Pedido de Venda',
      description: 'Permite abrir solicitações de pedidos de venda',
      module: 'sales',
      resource: 'orders',
      action: 'request',
    },
    {
      code: 'sales.orders.approve',
      name: 'Aprovar Pedido de Venda',
      description: 'Permite aprovar pedidos de venda',
      module: 'sales',
      resource: 'orders',
      action: 'approve',
    },
    {
      code: 'sales.orders.manage',
      name: 'Gerenciar Pedidos de Venda',
      description: 'Acesso completo ao gerenciamento de pedidos de venda',
      module: 'sales',
      resource: 'orders',
      action: 'manage',
    },

    // Promotions
    {
      code: 'sales.promotions.create',
      name: 'Criar Promoção',
      description: 'Permite criar novas promoções',
      module: 'sales',
      resource: 'promotions',
      action: 'create',
    },
    {
      code: 'sales.promotions.read',
      name: 'Ler Promoção',
      description: 'Permite visualizar promoções',
      module: 'sales',
      resource: 'promotions',
      action: 'read',
    },
    {
      code: 'sales.promotions.update',
      name: 'Atualizar Promoção',
      description: 'Permite atualizar promoções',
      module: 'sales',
      resource: 'promotions',
      action: 'update',
    },
    {
      code: 'sales.promotions.delete',
      name: 'Deletar Promoção',
      description: 'Permite deletar promoções',
      module: 'sales',
      resource: 'promotions',
      action: 'delete',
    },
    {
      code: 'sales.promotions.list',
      name: 'Listar Promoções',
      description: 'Permite listar todas as promoções',
      module: 'sales',
      resource: 'promotions',
      action: 'list',
    },
    {
      code: 'sales.promotions.manage',
      name: 'Gerenciar Promoções',
      description: 'Acesso completo ao gerenciamento de promoções',
      module: 'sales',
      resource: 'promotions',
      action: 'manage',
    },

    // Reservations
    {
      code: 'sales.reservations.create',
      name: 'Criar Reserva',
      description: 'Permite criar novas reservas',
      module: 'sales',
      resource: 'reservations',
      action: 'create',
    },
    {
      code: 'sales.reservations.read',
      name: 'Ler Reserva',
      description: 'Permite visualizar reservas',
      module: 'sales',
      resource: 'reservations',
      action: 'read',
    },
    {
      code: 'sales.reservations.update',
      name: 'Atualizar Reserva',
      description: 'Permite atualizar reservas',
      module: 'sales',
      resource: 'reservations',
      action: 'update',
    },
    {
      code: 'sales.reservations.delete',
      name: 'Deletar Reserva',
      description: 'Permite deletar reservas',
      module: 'sales',
      resource: 'reservations',
      action: 'delete',
    },
    {
      code: 'sales.reservations.list',
      name: 'Listar Reservas',
      description: 'Permite listar todas as reservas',
      module: 'sales',
      resource: 'reservations',
      action: 'list',
    },
    {
      code: 'sales.reservations.manage',
      name: 'Gerenciar Reservas',
      description: 'Acesso completo ao gerenciamento de reservas',
      module: 'sales',
      resource: 'reservations',
      action: 'manage',
    },

    // Comments
    {
      code: 'sales.comments.create',
      name: 'Criar Comentário',
      description: 'Permite criar novos comentários',
      module: 'sales',
      resource: 'comments',
      action: 'create',
    },
    {
      code: 'sales.comments.read',
      name: 'Ler Comentário',
      description: 'Permite visualizar comentários',
      module: 'sales',
      resource: 'comments',
      action: 'read',
    },
    {
      code: 'sales.comments.update',
      name: 'Atualizar Comentário',
      description: 'Permite atualizar comentários',
      module: 'sales',
      resource: 'comments',
      action: 'update',
    },
    {
      code: 'sales.comments.delete',
      name: 'Deletar Comentário',
      description: 'Permite deletar comentários',
      module: 'sales',
      resource: 'comments',
      action: 'delete',
    },
    {
      code: 'sales.comments.list',
      name: 'Listar Comentários',
      description: 'Permite listar todos os comentários',
      module: 'sales',
      resource: 'comments',
      action: 'list',
    },
    {
      code: 'sales.comments.manage',
      name: 'Gerenciar Comentários',
      description: 'Acesso completo ao gerenciamento de comentários',
      module: 'sales',
      resource: 'comments',
      action: 'manage',
    },

    // Notifications
    {
      code: 'sales.notifications.create',
      name: 'Criar Notificação',
      description: 'Permite criar novas notificações',
      module: 'sales',
      resource: 'notifications',
      action: 'create',
    },
    {
      code: 'sales.notifications.read',
      name: 'Ler Notificação',
      description: 'Permite visualizar notificações',
      module: 'sales',
      resource: 'notifications',
      action: 'read',
    },
    {
      code: 'sales.notifications.update',
      name: 'Atualizar Notificação',
      description: 'Permite atualizar notificações',
      module: 'sales',
      resource: 'notifications',
      action: 'update',
    },
    {
      code: 'sales.notifications.delete',
      name: 'Deletar Notificação',
      description: 'Permite deletar notificações',
      module: 'sales',
      resource: 'notifications',
      action: 'delete',
    },
    {
      code: 'sales.notifications.list',
      name: 'Listar Notificações',
      description: 'Permite listar todas as notificações',
      module: 'sales',
      resource: 'notifications',
      action: 'list',
    },

    // ==================== RBAC MODULE ====================
    // Permissions
    {
      code: 'rbac.permissions.create',
      name: 'Criar Permissão',
      description: 'Permite criar novas permissões',
      module: 'rbac',
      resource: 'permissions',
      action: 'create',
    },
    {
      code: 'rbac.permissions.read',
      name: 'Ler Permissão',
      description: 'Permite visualizar permissões',
      module: 'rbac',
      resource: 'permissions',
      action: 'read',
    },
    {
      code: 'rbac.permissions.update',
      name: 'Atualizar Permissão',
      description: 'Permite atualizar permissões',
      module: 'rbac',
      resource: 'permissions',
      action: 'update',
    },
    {
      code: 'rbac.permissions.delete',
      name: 'Deletar Permissão',
      description: 'Permite deletar permissões',
      module: 'rbac',
      resource: 'permissions',
      action: 'delete',
    },
    {
      code: 'rbac.permissions.list',
      name: 'Listar Permissões',
      description: 'Permite listar todas as permissões',
      module: 'rbac',
      resource: 'permissions',
      action: 'list',
    },

    // Permission Groups
    {
      code: 'rbac.groups.create',
      name: 'Criar Grupo',
      description: 'Permite criar novos grupos de permissões',
      module: 'rbac',
      resource: 'groups',
      action: 'create',
    },
    {
      code: 'rbac.groups.read',
      name: 'Ler Grupo',
      description: 'Permite visualizar grupos de permissões',
      module: 'rbac',
      resource: 'groups',
      action: 'read',
    },
    {
      code: 'rbac.groups.update',
      name: 'Atualizar Grupo',
      description: 'Permite atualizar grupos de permissões',
      module: 'rbac',
      resource: 'groups',
      action: 'update',
    },
    {
      code: 'rbac.groups.delete',
      name: 'Deletar Grupo',
      description: 'Permite deletar grupos de permissões',
      module: 'rbac',
      resource: 'groups',
      action: 'delete',
    },
    {
      code: 'rbac.groups.list',
      name: 'Listar Grupos',
      description: 'Permite listar todos os grupos de permissões',
      module: 'rbac',
      resource: 'groups',
      action: 'list',
    },
    {
      code: 'rbac.groups.assign',
      name: 'Atribuir Grupo',
      description: 'Permite atribuir grupos a usuários',
      module: 'rbac',
      resource: 'groups',
      action: 'assign',
    },
    {
      code: 'rbac.groups.manage',
      name: 'Gerenciar Grupos',
      description: 'Acesso completo ao gerenciamento de grupos',
      module: 'rbac',
      resource: 'groups',
      action: 'manage',
    },

    // Audit Logs
    {
      code: 'rbac.audit.read',
      name: 'Ler Auditoria',
      description: 'Permite visualizar logs de auditoria',
      module: 'rbac',
      resource: 'audit',
      action: 'read',
    },
    {
      code: 'rbac.audit.list',
      name: 'Listar Auditoria',
      description: 'Permite listar todos os logs de auditoria',
      module: 'rbac',
      resource: 'audit',
      action: 'list',
    },

    // ==================== AUDIT MODULE ====================
    // Audit Logs
    {
      code: 'audit.logs.view',
      name: 'Ver Logs de Auditoria',
      description: 'Permite visualizar logs de auditoria do sistema',
      module: 'audit',
      resource: 'logs',
      action: 'view',
    },
    {
      code: 'audit.history.view',
      name: 'Ver Histórico de Entidade',
      description: 'Permite visualizar histórico completo de uma entidade',
      module: 'audit',
      resource: 'history',
      action: 'view',
    },
    {
      code: 'audit.rollback.preview',
      name: 'Visualizar Preview de Rollback',
      description: 'Permite visualizar preview de rollback de alterações',
      module: 'audit',
      resource: 'rollback',
      action: 'preview',
    },
    {
      code: 'audit.compare.view',
      name: 'Comparar Versões',
      description: 'Permite comparar diferentes versões de uma entidade',
      module: 'audit',
      resource: 'compare',
      action: 'view',
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: {
        ...permission,
        isSystem: true, // Permissões básicas são do sistema
      },
    });
  }

  console.log(`✅ ${permissions.length} permissões criadas/atualizadas\n`);

  // =============================================
  // 2. CRIAR GRUPOS DE PERMISSÕES
  // =============================================

  console.log('👥 Criando grupos de permissões...');

  // ========== ADMIN GROUP (Super Admin) ==========
  let adminGroup = await prisma.permissionGroup.findFirst({
    where: { slug: 'admin', deletedAt: null }
  });
  
  if (!adminGroup) {
    adminGroup = await prisma.permissionGroup.create({
      data: {
        name: 'Administrador',
        slug: 'admin',
        description:
          'Acesso completo ao sistema. Equivalente à role ADMIN antiga.',
        isSystem: true,
        isActive: true,
        color: '#DC2626', // red-600
        priority: 100,
      }
    });
  }

  // Atribuir TODAS as permissões ao Admin
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
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
    });
  }

  console.log(
    `✅ Grupo "Administrador" criado com ${allPermissions.length} permissões`,
  );

  // ========== CRIAR USUÁRIO ADMIN PADRÃO ==========
  const adminPassword = await hash('Teste@123', 6);

  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@teste.com', deletedAt: null }
  });
  
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@teste.com',
        username: 'admin',
        password_hash: adminPassword,
        role: 'ADMIN', // Mantido por compatibilidade (DEPRECATED)
      }
    });
  } else {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password_hash: adminPassword,
      }
    });
  }

  // Atribuir grupo admin ao usuário admin
  await prisma.userPermissionGroup.upsert({
    where: {
      userId_groupId: {
        userId: adminUser.id,
        groupId: adminGroup.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      groupId: adminGroup.id,
      grantedBy: null, // Sistema
    },
  });

  console.log(`✅ Usuário admin criado: admin@teste.com (senha: Teste@123)`);

  // ========== MANAGER GROUP ==========
  let managerGroup = await prisma.permissionGroup.findFirst({
    where: { slug: 'manager', deletedAt: null }
  });
  
  if (!managerGroup) {
    managerGroup = await prisma.permissionGroup.create({
      data: {
        name: 'Gerente',
        slug: 'manager',
        description:
          'Gerenciamento de estoque e vendas. Equivalente à role MANAGER antiga.',
        isSystem: true,
        isActive: true,
        color: '#EA580C', // orange-600
        priority: 50,
      }
    });
  }

  console.log(`✅ Grupo manager criado: ${managerGroup.name}`);

  // Permissões do Manager (todas de Stock e Sales, exceto delete e RBAC)
  const managerPermissionCodes = [
    // Stock - sem delete
    'stock.products.create',
    'stock.products.read',
    'stock.products.update',
    'stock.products.list',
    'stock.products.approve',
    'stock.variants.create',
    'stock.variants.read',
    'stock.variants.update',
    'stock.variants.list',
    'stock.variants.approve',
    'stock.items.create',
    'stock.items.read',
    'stock.items.update',
    'stock.items.list',
    'stock.items.approve',
    'stock.movements.create',
    'stock.movements.read',
    'stock.movements.list',
    'stock.movements.approve',
    'stock.suppliers.create',
    'stock.suppliers.read',
    'stock.suppliers.update',
    'stock.suppliers.list',
    'stock.manufacturers.create',
    'stock.manufacturers.read',
    'stock.manufacturers.update',
    'stock.manufacturers.list',
    'stock.locations.create',
    'stock.locations.read',
    'stock.locations.update',
    'stock.locations.list',
    'stock.categories.create',
    'stock.categories.read',
    'stock.categories.update',
    'stock.categories.list',
    'stock.tags.create',
    'stock.tags.read',
    'stock.tags.update',
    'stock.tags.list',
    'stock.templates.create',
    'stock.templates.read',
    'stock.templates.update',
    'stock.templates.list',
    'stock.purchase-orders.create',
    'stock.purchase-orders.read',
    'stock.purchase-orders.update',
    'stock.purchase-orders.list',
    'stock.purchase-orders.approve',

    // Sales - sem delete
    'sales.customers.create',
    'sales.customers.read',
    'sales.customers.update',
    'sales.customers.list',
    'sales.orders.create',
    'sales.orders.read',
    'sales.orders.update',
    'sales.orders.list',
    'sales.orders.approve',
    'sales.promotions.create',
    'sales.promotions.read',
    'sales.promotions.update',
    'sales.promotions.list',
    'sales.reservations.create',
    'sales.reservations.read',
    'sales.reservations.update',
    'sales.reservations.list',
    'sales.comments.create',
    'sales.comments.read',
    'sales.comments.update',
    'sales.comments.list',
    'sales.notifications.create',
    'sales.notifications.read',
    'sales.notifications.update',
    'sales.notifications.list',

    // Core - apenas leitura de usuários e sessões
    'core.users.read',
    'core.users.list',
    'core.sessions.read',
    'core.sessions.list',
    'core.profiles.read',
    'core.profiles.update',
  ];

  for (const code of managerPermissionCodes) {
    const permission = await prisma.permission.findUnique({ where: { code } });
    if (permission) {
      await prisma.permissionGroupPermission.upsert({
        where: {
          groupId_permissionId: {
            groupId: managerGroup.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          groupId: managerGroup.id,
          permissionId: permission.id,
          effect: 'allow',
        },
      });
    }
  }

  console.log(
    `✅ Grupo "Gerente" criado com ${managerPermissionCodes.length} permissões`,
  );

  // ========== USER GROUP ==========
  let userGroup = await prisma.permissionGroup.findFirst({
    where: { slug: 'user', deletedAt: null }
  });
  
  if (!userGroup) {
    userGroup = await prisma.permissionGroup.create({
      data: {
        name: 'Usuário',
        slug: 'user',
        description: 'Acesso básico de leitura. Equivalente à role USER antiga.',
        isSystem: true,
        isActive: true,
        color: '#2563EB', // blue-600
        priority: 10,
      }
    });
  }

  // Permissões do User (apenas leitura e request)
  const userPermissionCodes = [
    // Stock - apenas leitura e request
    'stock.products.read',
    'stock.products.list',
    'stock.products.request',
    'stock.variants.read',
    'stock.variants.list',
    'stock.variants.request',
    'stock.items.read',
    'stock.items.list',
    'stock.items.request',
    'stock.movements.read',
    'stock.movements.list',
    'stock.suppliers.read',
    'stock.suppliers.list',
    'stock.manufacturers.read',
    'stock.manufacturers.list',
    'stock.locations.read',
    'stock.locations.list',
    'stock.categories.read',
    'stock.categories.list',
    'stock.tags.read',
    'stock.tags.list',
    'stock.templates.read',
    'stock.templates.list',
    'stock.purchase-orders.read',
    'stock.purchase-orders.list',

    // Sales - apenas leitura e request
    'sales.customers.read',
    'sales.customers.list',
    'sales.orders.read',
    'sales.orders.list',
    'sales.orders.request',
    'sales.promotions.read',
    'sales.promotions.list',
    'sales.reservations.read',
    'sales.reservations.list',
    'sales.comments.create',
    'sales.comments.read',
    'sales.comments.list',
    'sales.notifications.read',
    'sales.notifications.list',

    // Core - próprio perfil
    'core.profiles.read',
    'core.profiles.update',
  ];

  for (const code of userPermissionCodes) {
    const permission = await prisma.permission.findUnique({ where: { code } });
    if (permission) {
      await prisma.permissionGroupPermission.upsert({
        where: {
          groupId_permissionId: {
            groupId: userGroup.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          groupId: userGroup.id,
          permissionId: permission.id,
          effect: 'allow',
        },
      });
    }
  }

  console.log(
    `✅ Grupo "Usuário" criado com ${userPermissionCodes.length} permissões\n`,
  );

  // =============================================
  // 3. MIGRAR USUÁRIOS EXISTENTES
  // =============================================

  console.log('🔄 Migrando usuários existentes para o novo sistema RBAC...');

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
    },
  });

  let migratedCount = 0;

  for (const user of users) {
    let targetGroup: typeof adminGroup | typeof managerGroup | typeof userGroup;

    // Mapear role antiga para novo grupo
    switch (user.role) {
      case 'ADMIN':
        targetGroup = adminGroup;
        break;
      case 'MANAGER':
        targetGroup = managerGroup;
        break;
      case 'USER':
      default:
        targetGroup = userGroup;
        break;
    }

    // Verificar se já está atribuído
    const existingAssignment = await prisma.userPermissionGroup.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: targetGroup.id,
        },
      },
    });

    if (!existingAssignment) {
      await prisma.userPermissionGroup.create({
        data: {
          userId: user.id,
          groupId: targetGroup.id,
          grantedBy: null, // Migração automática
        },
      });
      migratedCount++;
    }
  }

  console.log(`✅ ${migratedCount} usuários migrados para o novo sistema RBAC`);
  console.log(`   - Total de usuários no sistema: ${users.length}\n`);

  // =============================================
  // RESUMO
  // =============================================

  console.log('🎉 Seed concluído com sucesso!\n');
  console.log('📊 Resumo:');
  console.log(`   - ${permissions.length} permissões criadas`);
  console.log(`   - 3 grupos básicos criados (Admin, Manager, User)`);
  console.log(`   - 1 usuário admin criado (admin@teste.com)`);
  console.log(`   - ${migratedCount} usuários migrados`);
  console.log('\n✅ Sistema RBAC pronto para uso!');
  console.log('\n📌 IMPORTANTE: A coluna "role" está DEPRECATED.');
  console.log('   Use Permission Groups para controle de acesso.');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
