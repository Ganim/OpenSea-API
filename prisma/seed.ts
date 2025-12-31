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
 * O controle de acesso é feito através de Permission Groups.
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

    // Care (Instruções de Conservação)
    {
      code: 'stock.care.read',
      name: 'Ler Instruções de Conservação',
      description: 'Permite visualizar o catálogo de instruções de conservação',
      module: 'stock',
      resource: 'care',
      action: 'read',
    },
    {
      code: 'stock.care.list',
      name: 'Listar Instruções de Conservação',
      description: 'Permite listar todas as opções de conservação',
      module: 'stock',
      resource: 'care',
      action: 'list',
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

    // Assignments
    {
      code: 'rbac.assignments.create',
      name: 'Criar Atribuição',
      description: 'Permite criar atribuições de permissões',
      module: 'rbac',
      resource: 'assignments',
      action: 'create',
    },
    {
      code: 'rbac.assignments.read',
      name: 'Ler Atribuição',
      description: 'Permite visualizar atribuições de permissões',
      module: 'rbac',
      resource: 'assignments',
      action: 'read',
    },
    {
      code: 'rbac.assignments.update',
      name: 'Atualizar Atribuição',
      description: 'Permite atualizar atribuições de permissões',
      module: 'rbac',
      resource: 'assignments',
      action: 'update',
    },
    {
      code: 'rbac.assignments.delete',
      name: 'Deletar Atribuição',
      description: 'Permite deletar atribuições de permissões',
      module: 'rbac',
      resource: 'assignments',
      action: 'delete',
    },
    {
      code: 'rbac.assignments.list',
      name: 'Listar Atribuições',
      description: 'Permite listar todas as atribuições de permissões',
      module: 'rbac',
      resource: 'assignments',
      action: 'list',
    },
    {
      code: 'rbac.assignments.manage',
      name: 'Gerenciar Atribuições',
      description: 'Acesso completo ao gerenciamento de atribuições',
      module: 'rbac',
      resource: 'assignments',
      action: 'manage',
    },

    // Associations
    {
      code: 'rbac.associations.create',
      name: 'Criar Associação',
      description: 'Permite criar associações entre permissões e grupos',
      module: 'rbac',
      resource: 'associations',
      action: 'create',
    },
    {
      code: 'rbac.associations.read',
      name: 'Ler Associação',
      description: 'Permite visualizar associações entre permissões e grupos',
      module: 'rbac',
      resource: 'associations',
      action: 'read',
    },
    {
      code: 'rbac.associations.update',
      name: 'Atualizar Associação',
      description: 'Permite atualizar associações entre permissões e grupos',
      module: 'rbac',
      resource: 'associations',
      action: 'update',
    },
    {
      code: 'rbac.associations.delete',
      name: 'Deletar Associação',
      description: 'Permite deletar associações entre permissões e grupos',
      module: 'rbac',
      resource: 'associations',
      action: 'delete',
    },
    {
      code: 'rbac.associations.list',
      name: 'Listar Associações',
      description: 'Permite listar todas as associações entre permissões e grupos',
      module: 'rbac',
      resource: 'associations',
      action: 'list',
    },
    {
      code: 'rbac.associations.manage',
      name: 'Gerenciar Associações',
      description: 'Acesso completo ao gerenciamento de associações',
      module: 'rbac',
      resource: 'associations',
      action: 'manage',
    },

    // User Groups
    {
      code: 'rbac.user-groups.create',
      name: 'Atribuir Grupo a Usuário',
      description: 'Permite atribuir grupos de permissões a usuários',
      module: 'rbac',
      resource: 'user-groups',
      action: 'create',
    },
    {
      code: 'rbac.user-groups.read',
      name: 'Visualizar Grupos do Usuário',
      description: 'Permite visualizar grupos de permissões atribuídos a usuários',
      module: 'rbac',
      resource: 'user-groups',
      action: 'read',
    },
    {
      code: 'rbac.user-groups.update',
      name: 'Atualizar Atribuição de Grupo',
      description: 'Permite atualizar atribuições de grupos a usuários',
      module: 'rbac',
      resource: 'user-groups',
      action: 'update',
    },
    {
      code: 'rbac.user-groups.delete',
      name: 'Remover Grupo do Usuário',
      description: 'Permite remover grupos de permissões de usuários',
      module: 'rbac',
      resource: 'user-groups',
      action: 'delete',
    },
    {
      code: 'rbac.user-groups.list',
      name: 'Listar Grupos de Usuários',
      description: 'Permite listar todos os grupos atribuídos a usuários',
      module: 'rbac',
      resource: 'user-groups',
      action: 'list',
    },
    {
      code: 'rbac.user-groups.manage',
      name: 'Gerenciar Grupos de Usuários',
      description: 'Acesso completo ao gerenciamento de grupos de usuários',
      module: 'rbac',
      resource: 'user-groups',
      action: 'manage',
    },

    // User Permissions
    {
      code: 'rbac.user-permissions.create',
      name: 'Conceder Permissão Direta',
      description: 'Permite conceder permissões diretamente a usuários',
      module: 'rbac',
      resource: 'user-permissions',
      action: 'create',
    },
    {
      code: 'rbac.user-permissions.read',
      name: 'Visualizar Permissões do Usuário',
      description: 'Permite visualizar permissões diretas de usuários',
      module: 'rbac',
      resource: 'user-permissions',
      action: 'read',
    },
    {
      code: 'rbac.user-permissions.update',
      name: 'Atualizar Permissão Direta',
      description: 'Permite atualizar permissões diretas de usuários',
      module: 'rbac',
      resource: 'user-permissions',
      action: 'update',
    },
    {
      code: 'rbac.user-permissions.delete',
      name: 'Revogar Permissão Direta',
      description: 'Permite revogar permissões diretas de usuários',
      module: 'rbac',
      resource: 'user-permissions',
      action: 'delete',
    },
    {
      code: 'rbac.user-permissions.list',
      name: 'Listar Permissões Diretas',
      description: 'Permite listar todas as permissões diretas de usuários',
      module: 'rbac',
      resource: 'user-permissions',
      action: 'list',
    },
    {
      code: 'rbac.user-permissions.manage',
      name: 'Gerenciar Permissões Diretas',
      description: 'Acesso completo ao gerenciamento de permissões diretas',
      module: 'rbac',
      resource: 'user-permissions',
      action: 'manage',
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

    // ==================== HR MODULE ====================
    // Companies
    {
      code: 'hr.companies.create',
      name: 'Criar Empresa',
      description: 'Permite criar novas empresas',
      module: 'hr',
      resource: 'companies',
      action: 'create',
    },
    {
      code: 'hr.companies.read',
      name: 'Visualizar Empresa',
      description: 'Permite visualizar informações de empresas',
      module: 'hr',
      resource: 'companies',
      action: 'read',
    },
    {
      code: 'hr.companies.update',
      name: 'Atualizar Empresa',
      description: 'Permite atualizar informações de empresas',
      module: 'hr',
      resource: 'companies',
      action: 'update',
    },
    {
      code: 'hr.companies.delete',
      name: 'Excluir Empresa',
      description: 'Permite excluir empresas',
      module: 'hr',
      resource: 'companies',
      action: 'delete',
    },
    {
      code: 'hr.companies.list',
      name: 'Listar Empresas',
      description: 'Permite listar todas as empresas',
      module: 'hr',
      resource: 'companies',
      action: 'list',
    },
    {
      code: 'hr.companies.manage',
      name: 'Gerenciar Empresas',
      description: 'Permite gerenciar todas as operações de empresas',
      module: 'hr',
      resource: 'companies',
      action: 'manage',
    },

    // Employees
    {
      code: 'hr.employees.create',
      name: 'Criar Funcionário',
      description: 'Permite criar novos funcionários',
      module: 'hr',
      resource: 'employees',
      action: 'create',
    },
    {
      code: 'hr.employees.read',
      name: 'Visualizar Funcionário',
      description: 'Permite visualizar informações de funcionários',
      module: 'hr',
      resource: 'employees',
      action: 'read',
    },
    {
      code: 'hr.employees.update',
      name: 'Atualizar Funcionário',
      description: 'Permite atualizar informações de funcionários',
      module: 'hr',
      resource: 'employees',
      action: 'update',
    },
    {
      code: 'hr.employees.delete',
      name: 'Excluir Funcionário',
      description: 'Permite excluir funcionários',
      module: 'hr',
      resource: 'employees',
      action: 'delete',
    },
    {
      code: 'hr.employees.list',
      name: 'Listar Funcionários',
      description: 'Permite listar todos os funcionários',
      module: 'hr',
      resource: 'employees',
      action: 'list',
    },
    {
      code: 'hr.employees.manage',
      name: 'Gerenciar Funcionários',
      description: 'Permite gerenciar todas as operações de funcionários',
      module: 'hr',
      resource: 'employees',
      action: 'manage',
    },

    // Departments
    {
      code: 'hr.departments.create',
      name: 'Criar Departamento',
      description: 'Permite criar novos departamentos',
      module: 'hr',
      resource: 'departments',
      action: 'create',
    },
    {
      code: 'hr.departments.read',
      name: 'Visualizar Departamento',
      description: 'Permite visualizar informações de departamentos',
      module: 'hr',
      resource: 'departments',
      action: 'read',
    },
    {
      code: 'hr.departments.update',
      name: 'Atualizar Departamento',
      description: 'Permite atualizar informações de departamentos',
      module: 'hr',
      resource: 'departments',
      action: 'update',
    },
    {
      code: 'hr.departments.delete',
      name: 'Excluir Departamento',
      description: 'Permite excluir departamentos',
      module: 'hr',
      resource: 'departments',
      action: 'delete',
    },
    {
      code: 'hr.departments.list',
      name: 'Listar Departamentos',
      description: 'Permite listar todos os departamentos',
      module: 'hr',
      resource: 'departments',
      action: 'list',
    },
    {
      code: 'hr.departments.manage',
      name: 'Gerenciar Departamentos',
      description: 'Permite gerenciar todas as operações de departamentos',
      module: 'hr',
      resource: 'departments',
      action: 'manage',
    },

    // Positions
    {
      code: 'hr.positions.create',
      name: 'Criar Cargo',
      description: 'Permite criar novos cargos',
      module: 'hr',
      resource: 'positions',
      action: 'create',
    },
    {
      code: 'hr.positions.read',
      name: 'Visualizar Cargo',
      description: 'Permite visualizar informações de cargos',
      module: 'hr',
      resource: 'positions',
      action: 'read',
    },
    {
      code: 'hr.positions.update',
      name: 'Atualizar Cargo',
      description: 'Permite atualizar informações de cargos',
      module: 'hr',
      resource: 'positions',
      action: 'update',
    },
    {
      code: 'hr.positions.delete',
      name: 'Excluir Cargo',
      description: 'Permite excluir cargos',
      module: 'hr',
      resource: 'positions',
      action: 'delete',
    },
    {
      code: 'hr.positions.list',
      name: 'Listar Cargos',
      description: 'Permite listar todos os cargos',
      module: 'hr',
      resource: 'positions',
      action: 'list',
    },
    {
      code: 'hr.positions.manage',
      name: 'Gerenciar Cargos',
      description: 'Permite gerenciar todas as operações de cargos',
      module: 'hr',
      resource: 'positions',
      action: 'manage',
    },

    // Absences
    {
      code: 'hr.absences.create',
      name: 'Criar Ausência',
      description: 'Permite criar registros de ausências',
      module: 'hr',
      resource: 'absences',
      action: 'create',
    },
    {
      code: 'hr.absences.read',
      name: 'Visualizar Ausência',
      description: 'Permite visualizar informações de ausências',
      module: 'hr',
      resource: 'absences',
      action: 'read',
    },
    {
      code: 'hr.absences.update',
      name: 'Atualizar Ausência',
      description: 'Permite atualizar informações de ausências',
      module: 'hr',
      resource: 'absences',
      action: 'update',
    },
    {
      code: 'hr.absences.delete',
      name: 'Excluir Ausência',
      description: 'Permite excluir ausências',
      module: 'hr',
      resource: 'absences',
      action: 'delete',
    },
    {
      code: 'hr.absences.list',
      name: 'Listar Ausências',
      description: 'Permite listar todas as ausências',
      module: 'hr',
      resource: 'absences',
      action: 'list',
    },
    {
      code: 'hr.absences.approve',
      name: 'Aprovar Ausência',
      description: 'Permite aprovar solicitações de ausências',
      module: 'hr',
      resource: 'absences',
      action: 'approve',
    },
    {
      code: 'hr.absences.manage',
      name: 'Gerenciar Ausências',
      description: 'Permite gerenciar todas as operações de ausências',
      module: 'hr',
      resource: 'absences',
      action: 'manage',
    },

    // Vacations
    {
      code: 'hr.vacations.create',
      name: 'Criar Férias',
      description: 'Permite criar registros de férias',
      module: 'hr',
      resource: 'vacations',
      action: 'create',
    },
    {
      code: 'hr.vacations.read',
      name: 'Visualizar Férias',
      description: 'Permite visualizar informações de férias',
      module: 'hr',
      resource: 'vacations',
      action: 'read',
    },
    {
      code: 'hr.vacations.update',
      name: 'Atualizar Férias',
      description: 'Permite atualizar informações de férias',
      module: 'hr',
      resource: 'vacations',
      action: 'update',
    },
    {
      code: 'hr.vacations.delete',
      name: 'Excluir Férias',
      description: 'Permite excluir férias',
      module: 'hr',
      resource: 'vacations',
      action: 'delete',
    },
    {
      code: 'hr.vacations.list',
      name: 'Listar Férias',
      description: 'Permite listar todas as férias',
      module: 'hr',
      resource: 'vacations',
      action: 'list',
    },
    {
      code: 'hr.vacations.approve',
      name: 'Aprovar Férias',
      description: 'Permite aprovar solicitações de férias',
      module: 'hr',
      resource: 'vacations',
      action: 'approve',
    },
    {
      code: 'hr.vacations.manage',
      name: 'Gerenciar Férias',
      description: 'Permite gerenciar todas as operações de férias',
      module: 'hr',
      resource: 'vacations',
      action: 'manage',
    },

    // Time Entries
    {
      code: 'hr.time-entries.create',
      name: 'Criar Registro de Ponto',
      description: 'Permite criar registros de ponto',
      module: 'hr',
      resource: 'time-entries',
      action: 'create',
    },
    {
      code: 'hr.time-entries.read',
      name: 'Visualizar Registro de Ponto',
      description: 'Permite visualizar registros de ponto',
      module: 'hr',
      resource: 'time-entries',
      action: 'read',
    },
    {
      code: 'hr.time-entries.update',
      name: 'Atualizar Registro de Ponto',
      description: 'Permite atualizar registros de ponto',
      module: 'hr',
      resource: 'time-entries',
      action: 'update',
    },
    {
      code: 'hr.time-entries.delete',
      name: 'Excluir Registro de Ponto',
      description: 'Permite excluir registros de ponto',
      module: 'hr',
      resource: 'time-entries',
      action: 'delete',
    },
    {
      code: 'hr.time-entries.list',
      name: 'Listar Registros de Ponto',
      description: 'Permite listar todos os registros de ponto',
      module: 'hr',
      resource: 'time-entries',
      action: 'list',
    },
    {
      code: 'hr.time-entries.manage',
      name: 'Gerenciar Registros de Ponto',
      description: 'Permite gerenciar todas as operações de registros de ponto',
      module: 'hr',
      resource: 'time-entries',
      action: 'manage',
    },

    // Overtime
    {
      code: 'hr.overtime.create',
      name: 'Criar Hora Extra',
      description: 'Permite criar registros de horas extras',
      module: 'hr',
      resource: 'overtime',
      action: 'create',
    },
    {
      code: 'hr.overtime.read',
      name: 'Visualizar Hora Extra',
      description: 'Permite visualizar registros de horas extras',
      module: 'hr',
      resource: 'overtime',
      action: 'read',
    },
    {
      code: 'hr.overtime.update',
      name: 'Atualizar Hora Extra',
      description: 'Permite atualizar registros de horas extras',
      module: 'hr',
      resource: 'overtime',
      action: 'update',
    },
    {
      code: 'hr.overtime.delete',
      name: 'Excluir Hora Extra',
      description: 'Permite excluir registros de horas extras',
      module: 'hr',
      resource: 'overtime',
      action: 'delete',
    },
    {
      code: 'hr.overtime.list',
      name: 'Listar Horas Extras',
      description: 'Permite listar todos os registros de horas extras',
      module: 'hr',
      resource: 'overtime',
      action: 'list',
    },
    {
      code: 'hr.overtime.approve',
      name: 'Aprovar Hora Extra',
      description: 'Permite aprovar solicitações de horas extras',
      module: 'hr',
      resource: 'overtime',
      action: 'approve',
    },
    {
      code: 'hr.overtime.manage',
      name: 'Gerenciar Horas Extras',
      description: 'Permite gerenciar todas as operações de horas extras',
      module: 'hr',
      resource: 'overtime',
      action: 'manage',
    },

    // Payroll
    {
      code: 'hr.payroll.create',
      name: 'Criar Folha de Pagamento',
      description: 'Permite criar folhas de pagamento',
      module: 'hr',
      resource: 'payroll',
      action: 'create',
    },
    {
      code: 'hr.payroll.read',
      name: 'Visualizar Folha de Pagamento',
      description: 'Permite visualizar folhas de pagamento',
      module: 'hr',
      resource: 'payroll',
      action: 'read',
    },
    {
      code: 'hr.payroll.update',
      name: 'Atualizar Folha de Pagamento',
      description: 'Permite atualizar folhas de pagamento',
      module: 'hr',
      resource: 'payroll',
      action: 'update',
    },
    {
      code: 'hr.payroll.delete',
      name: 'Excluir Folha de Pagamento',
      description: 'Permite excluir folhas de pagamento',
      module: 'hr',
      resource: 'payroll',
      action: 'delete',
    },
    {
      code: 'hr.payroll.list',
      name: 'Listar Folhas de Pagamento',
      description: 'Permite listar todas as folhas de pagamento',
      module: 'hr',
      resource: 'payroll',
      action: 'list',
    },
    {
      code: 'hr.payroll.process',
      name: 'Processar Folha de Pagamento',
      description: 'Permite processar folhas de pagamento',
      module: 'hr',
      resource: 'payroll',
      action: 'process',
    },
    {
      code: 'hr.payroll.manage',
      name: 'Gerenciar Folhas de Pagamento',
      description: 'Permite gerenciar todas as operações de folhas de pagamento',
      module: 'hr',
      resource: 'payroll',
      action: 'manage',
    },

    // Bonuses
    {
      code: 'hr.bonuses.create',
      name: 'Criar Bônus',
      description: 'Permite criar bônus',
      module: 'hr',
      resource: 'bonuses',
      action: 'create',
    },
    {
      code: 'hr.bonuses.read',
      name: 'Visualizar Bônus',
      description: 'Permite visualizar bônus',
      module: 'hr',
      resource: 'bonuses',
      action: 'read',
    },
    {
      code: 'hr.bonuses.update',
      name: 'Atualizar Bônus',
      description: 'Permite atualizar bônus',
      module: 'hr',
      resource: 'bonuses',
      action: 'update',
    },
    {
      code: 'hr.bonuses.delete',
      name: 'Excluir Bônus',
      description: 'Permite excluir bônus',
      module: 'hr',
      resource: 'bonuses',
      action: 'delete',
    },
    {
      code: 'hr.bonuses.list',
      name: 'Listar Bônus',
      description: 'Permite listar todos os bônus',
      module: 'hr',
      resource: 'bonuses',
      action: 'list',
    },
    {
      code: 'hr.bonuses.manage',
      name: 'Gerenciar Bônus',
      description: 'Permite gerenciar todas as operações de bônus',
      module: 'hr',
      resource: 'bonuses',
      action: 'manage',
    },

    // Deductions
    {
      code: 'hr.deductions.create',
      name: 'Criar Desconto',
      description: 'Permite criar descontos',
      module: 'hr',
      resource: 'deductions',
      action: 'create',
    },
    {
      code: 'hr.deductions.read',
      name: 'Visualizar Desconto',
      description: 'Permite visualizar descontos',
      module: 'hr',
      resource: 'deductions',
      action: 'read',
    },
    {
      code: 'hr.deductions.update',
      name: 'Atualizar Desconto',
      description: 'Permite atualizar descontos',
      module: 'hr',
      resource: 'deductions',
      action: 'update',
    },
    {
      code: 'hr.deductions.delete',
      name: 'Excluir Desconto',
      description: 'Permite excluir descontos',
      module: 'hr',
      resource: 'deductions',
      action: 'delete',
    },
    {
      code: 'hr.deductions.list',
      name: 'Listar Descontos',
      description: 'Permite listar todos os descontos',
      module: 'hr',
      resource: 'deductions',
      action: 'list',
    },
    {
      code: 'hr.deductions.manage',
      name: 'Gerenciar Descontos',
      description: 'Permite gerenciar todas as operações de descontos',
      module: 'hr',
      resource: 'deductions',
      action: 'manage',
    },

    // Fiscal Settings
    {
      code: 'hr.fiscal-settings.create',
      name: 'Criar Configurações Fiscais',
      description: 'Permite criar configurações fiscais',
      module: 'hr',
      resource: 'fiscal-settings',
      action: 'create',
    },
    {
      code: 'hr.fiscal-settings.read',
      name: 'Visualizar Configurações Fiscais',
      description: 'Permite visualizar configurações fiscais',
      module: 'hr',
      resource: 'fiscal-settings',
      action: 'read',
    },
    {
      code: 'hr.fiscal-settings.update',
      name: 'Atualizar Configurações Fiscais',
      description: 'Permite atualizar configurações fiscais',
      module: 'hr',
      resource: 'fiscal-settings',
      action: 'update',
    },
    {
      code: 'hr.fiscal-settings.delete',
      name: 'Excluir Configurações Fiscais',
      description: 'Permite excluir configurações fiscais',
      module: 'hr',
      resource: 'fiscal-settings',
      action: 'delete',
    },
    {
      code: 'hr.fiscal-settings.manage',
      name: 'Gerenciar Configurações Fiscais',
      description: 'Permite gerenciar todas as operações de configurações fiscais',
      module: 'hr',
      resource: 'fiscal-settings',
      action: 'manage',
    },

    // Stakeholders
    {
      code: 'hr.stakeholders.create',
      name: 'Criar Stakeholder',
      description: 'Permite criar stakeholders',
      module: 'hr',
      resource: 'stakeholders',
      action: 'create',
    },
    {
      code: 'hr.stakeholders.read',
      name: 'Visualizar Stakeholder',
      description: 'Permite visualizar stakeholders',
      module: 'hr',
      resource: 'stakeholders',
      action: 'read',
    },
    {
      code: 'hr.stakeholders.update',
      name: 'Atualizar Stakeholder',
      description: 'Permite atualizar stakeholders',
      module: 'hr',
      resource: 'stakeholders',
      action: 'update',
    },
    {
      code: 'hr.stakeholders.delete',
      name: 'Excluir Stakeholder',
      description: 'Permite excluir stakeholders',
      module: 'hr',
      resource: 'stakeholders',
      action: 'delete',
    },
    {
      code: 'hr.stakeholders.list',
      name: 'Listar Stakeholders',
      description: 'Permite listar todos os stakeholders',
      module: 'hr',
      resource: 'stakeholders',
      action: 'list',
    },
    {
      code: 'hr.stakeholders.manage',
      name: 'Gerenciar Stakeholders',
      description: 'Permite gerenciar todas as operações de stakeholders',
      module: 'hr',
      resource: 'stakeholders',
      action: 'manage',
    },

    // Company Addresses
    {
      code: 'hr.company-addresses.create',
      name: 'Criar Endereço de Empresa',
      description: 'Permite criar endereços de empresas',
      module: 'hr',
      resource: 'company-addresses',
      action: 'create',
    },
    {
      code: 'hr.company-addresses.read',
      name: 'Visualizar Endereço de Empresa',
      description: 'Permite visualizar endereços de empresas',
      module: 'hr',
      resource: 'company-addresses',
      action: 'read',
    },
    {
      code: 'hr.company-addresses.update',
      name: 'Atualizar Endereço de Empresa',
      description: 'Permite atualizar endereços de empresas',
      module: 'hr',
      resource: 'company-addresses',
      action: 'update',
    },
    {
      code: 'hr.company-addresses.delete',
      name: 'Excluir Endereço de Empresa',
      description: 'Permite excluir endereços de empresas',
      module: 'hr',
      resource: 'company-addresses',
      action: 'delete',
    },
    {
      code: 'hr.company-addresses.list',
      name: 'Listar Endereços de Empresas',
      description: 'Permite listar todos os endereços de empresas',
      module: 'hr',
      resource: 'company-addresses',
      action: 'list',
    },
    {
      code: 'hr.company-addresses.manage',
      name: 'Gerenciar Endereços de Empresas',
      description: 'Permite gerenciar todas as operações de endereços de empresas',
      module: 'hr',
      resource: 'company-addresses',
      action: 'manage',
    },

    // Company CNAEs
    {
      code: 'hr.company-cnaes.create',
      name: 'Criar CNAE de Empresa',
      description: 'Permite criar CNAEs de empresas',
      module: 'hr',
      resource: 'company-cnaes',
      action: 'create',
    },
    {
      code: 'hr.company-cnaes.read',
      name: 'Visualizar CNAE de Empresa',
      description: 'Permite visualizar CNAEs de empresas',
      module: 'hr',
      resource: 'company-cnaes',
      action: 'read',
    },
    {
      code: 'hr.company-cnaes.update',
      name: 'Atualizar CNAE de Empresa',
      description: 'Permite atualizar CNAEs de empresas',
      module: 'hr',
      resource: 'company-cnaes',
      action: 'update',
    },
    {
      code: 'hr.company-cnaes.delete',
      name: 'Excluir CNAE de Empresa',
      description: 'Permite excluir CNAEs de empresas',
      module: 'hr',
      resource: 'company-cnaes',
      action: 'delete',
    },
    {
      code: 'hr.company-cnaes.list',
      name: 'Listar CNAEs de Empresas',
      description: 'Permite listar todos os CNAEs de empresas',
      module: 'hr',
      resource: 'company-cnaes',
      action: 'list',
    },
    {
      code: 'hr.company-cnaes.manage',
      name: 'Gerenciar CNAEs de Empresas',
      description: 'Permite gerenciar todas as operações de CNAEs de empresas',
      module: 'hr',
      resource: 'company-cnaes',
      action: 'manage',
    },

    // Company Fiscal Settings
    {
      code: 'hr.company-fiscal-settings.create',
      name: 'Criar Configurações Fiscais de Empresa',
      description: 'Permite criar configurações fiscais de empresas',
      module: 'hr',
      resource: 'company-fiscal-settings',
      action: 'create',
    },
    {
      code: 'hr.company-fiscal-settings.read',
      name: 'Visualizar Configurações Fiscais de Empresa',
      description: 'Permite visualizar configurações fiscais de empresas',
      module: 'hr',
      resource: 'company-fiscal-settings',
      action: 'read',
    },
    {
      code: 'hr.company-fiscal-settings.update',
      name: 'Atualizar Configurações Fiscais de Empresa',
      description: 'Permite atualizar configurações fiscais de empresas',
      module: 'hr',
      resource: 'company-fiscal-settings',
      action: 'update',
    },
    {
      code: 'hr.company-fiscal-settings.delete',
      name: 'Excluir Configurações Fiscais de Empresa',
      description: 'Permite excluir configurações fiscais de empresas',
      module: 'hr',
      resource: 'company-fiscal-settings',
      action: 'delete',
    },
    {
      code: 'hr.company-fiscal-settings.list',
      name: 'Listar Configurações Fiscais de Empresas',
      description: 'Permite listar todas as configurações fiscais de empresas',
      module: 'hr',
      resource: 'company-fiscal-settings',
      action: 'list',
    },
    {
      code: 'hr.company-fiscal-settings.manage',
      name: 'Gerenciar Configurações Fiscais de Empresas',
      description: 'Permite gerenciar todas as operações de configurações fiscais de empresas',
      module: 'hr',
      resource: 'company-fiscal-settings',
      action: 'manage',
    },

    // Company Stakeholder
    {
      code: 'hr.company-stakeholder.create',
      name: 'Criar Stakeholder de Empresa',
      description: 'Permite criar stakeholders de empresas',
      module: 'hr',
      resource: 'company-stakeholder',
      action: 'create',
    },
    {
      code: 'hr.company-stakeholder.read',
      name: 'Visualizar Stakeholder de Empresa',
      description: 'Permite visualizar stakeholders de empresas',
      module: 'hr',
      resource: 'company-stakeholder',
      action: 'read',
    },
    {
      code: 'hr.company-stakeholder.update',
      name: 'Atualizar Stakeholder de Empresa',
      description: 'Permite atualizar stakeholders de empresas',
      module: 'hr',
      resource: 'company-stakeholder',
      action: 'update',
    },
    {
      code: 'hr.company-stakeholder.delete',
      name: 'Excluir Stakeholder de Empresa',
      description: 'Permite excluir stakeholders de empresas',
      module: 'hr',
      resource: 'company-stakeholder',
      action: 'delete',
    },
    {
      code: 'hr.company-stakeholder.list',
      name: 'Listar Stakeholders de Empresas',
      description: 'Permite listar todos os stakeholders de empresas',
      module: 'hr',
      resource: 'company-stakeholder',
      action: 'list',
    },
    {
      code: 'hr.company-stakeholder.manage',
      name: 'Gerenciar Stakeholders de Empresas',
      description: 'Permite gerenciar todas as operações de stakeholders de empresas',
      module: 'hr',
      resource: 'company-stakeholder',
      action: 'manage',
    },

    // Manufacturers
    {
      code: 'hr.manufacturers.create',
      name: 'Criar Fabricante',
      description: 'Permite criar fabricantes',
      module: 'hr',
      resource: 'manufacturers',
      action: 'create',
    },
    {
      code: 'hr.manufacturers.read',
      name: 'Visualizar Fabricante',
      description: 'Permite visualizar fabricantes',
      module: 'hr',
      resource: 'manufacturers',
      action: 'read',
    },
    {
      code: 'hr.manufacturers.update',
      name: 'Atualizar Fabricante',
      description: 'Permite atualizar fabricantes',
      module: 'hr',
      resource: 'manufacturers',
      action: 'update',
    },
    {
      code: 'hr.manufacturers.delete',
      name: 'Excluir Fabricante',
      description: 'Permite excluir fabricantes',
      module: 'hr',
      resource: 'manufacturers',
      action: 'delete',
    },
    {
      code: 'hr.manufacturers.list',
      name: 'Listar Fabricantes',
      description: 'Permite listar todos os fabricantes',
      module: 'hr',
      resource: 'manufacturers',
      action: 'list',
    },
    {
      code: 'hr.manufacturers.manage',
      name: 'Gerenciar Fabricantes',
      description: 'Permite gerenciar todas as operações de fabricantes',
      module: 'hr',
      resource: 'manufacturers',
      action: 'manage',
    },

    // Payrolls
    {
      code: 'hr.payrolls.create',
      name: 'Criar Folha de Pagamento (Plural)',
      description: 'Permite criar folhas de pagamento',
      module: 'hr',
      resource: 'payrolls',
      action: 'create',
    },
    {
      code: 'hr.payrolls.read',
      name: 'Visualizar Folha de Pagamento (Plural)',
      description: 'Permite visualizar folhas de pagamento',
      module: 'hr',
      resource: 'payrolls',
      action: 'read',
    },
    {
      code: 'hr.payrolls.update',
      name: 'Atualizar Folha de Pagamento (Plural)',
      description: 'Permite atualizar folhas de pagamento',
      module: 'hr',
      resource: 'payrolls',
      action: 'update',
    },
    {
      code: 'hr.payrolls.delete',
      name: 'Excluir Folha de Pagamento (Plural)',
      description: 'Permite excluir folhas de pagamento',
      module: 'hr',
      resource: 'payrolls',
      action: 'delete',
    },
    {
      code: 'hr.payrolls.list',
      name: 'Listar Folhas de Pagamento (Plural)',
      description: 'Permite listar todas as folhas de pagamento',
      module: 'hr',
      resource: 'payrolls',
      action: 'list',
    },
    {
      code: 'hr.payrolls.manage',
      name: 'Gerenciar Folhas de Pagamento (Plural)',
      description: 'Permite gerenciar todas as operações de folhas de pagamento',
      module: 'hr',
      resource: 'payrolls',
      action: 'manage',
    },

    // Suppliers
    {
      code: 'hr.suppliers.create',
      name: 'Criar Fornecedor (HR)',
      description: 'Permite criar fornecedores de RH',
      module: 'hr',
      resource: 'suppliers',
      action: 'create',
    },
    {
      code: 'hr.suppliers.read',
      name: 'Visualizar Fornecedor (HR)',
      description: 'Permite visualizar fornecedores de RH',
      module: 'hr',
      resource: 'suppliers',
      action: 'read',
    },
    {
      code: 'hr.suppliers.update',
      name: 'Atualizar Fornecedor (HR)',
      description: 'Permite atualizar fornecedores de RH',
      module: 'hr',
      resource: 'suppliers',
      action: 'update',
    },
    {
      code: 'hr.suppliers.delete',
      name: 'Excluir Fornecedor (HR)',
      description: 'Permite excluir fornecedores de RH',
      module: 'hr',
      resource: 'suppliers',
      action: 'delete',
    },
    {
      code: 'hr.suppliers.list',
      name: 'Listar Fornecedores (HR)',
      description: 'Permite listar todos os fornecedores de RH',
      module: 'hr',
      resource: 'suppliers',
      action: 'list',
    },
    {
      code: 'hr.suppliers.manage',
      name: 'Gerenciar Fornecedores (HR)',
      description: 'Permite gerenciar todas as operações de fornecedores de RH',
      module: 'hr',
      resource: 'suppliers',
      action: 'manage',
    },

    // Time Bank
    {
      code: 'hr.time-bank.create',
      name: 'Criar Banco de Horas',
      description: 'Permite criar registros de banco de horas',
      module: 'hr',
      resource: 'time-bank',
      action: 'create',
    },
    {
      code: 'hr.time-bank.read',
      name: 'Visualizar Banco de Horas',
      description: 'Permite visualizar registros de banco de horas',
      module: 'hr',
      resource: 'time-bank',
      action: 'read',
    },
    {
      code: 'hr.time-bank.update',
      name: 'Atualizar Banco de Horas',
      description: 'Permite atualizar registros de banco de horas',
      module: 'hr',
      resource: 'time-bank',
      action: 'update',
    },
    {
      code: 'hr.time-bank.delete',
      name: 'Excluir Banco de Horas',
      description: 'Permite excluir registros de banco de horas',
      module: 'hr',
      resource: 'time-bank',
      action: 'delete',
    },
    {
      code: 'hr.time-bank.list',
      name: 'Listar Bancos de Horas',
      description: 'Permite listar todos os registros de banco de horas',
      module: 'hr',
      resource: 'time-bank',
      action: 'list',
    },
    {
      code: 'hr.time-bank.manage',
      name: 'Gerenciar Bancos de Horas',
      description: 'Permite gerenciar todas as operações de banco de horas',
      module: 'hr',
      resource: 'time-bank',
      action: 'manage',
    },

    // Time Control
    {
      code: 'hr.time-control.create',
      name: 'Criar Controle de Ponto',
      description: 'Permite criar registros de controle de ponto',
      module: 'hr',
      resource: 'time-control',
      action: 'create',
    },
    {
      code: 'hr.time-control.read',
      name: 'Visualizar Controle de Ponto',
      description: 'Permite visualizar registros de controle de ponto',
      module: 'hr',
      resource: 'time-control',
      action: 'read',
    },
    {
      code: 'hr.time-control.update',
      name: 'Atualizar Controle de Ponto',
      description: 'Permite atualizar registros de controle de ponto',
      module: 'hr',
      resource: 'time-control',
      action: 'update',
    },
    {
      code: 'hr.time-control.delete',
      name: 'Excluir Controle de Ponto',
      description: 'Permite excluir registros de controle de ponto',
      module: 'hr',
      resource: 'time-control',
      action: 'delete',
    },
    {
      code: 'hr.time-control.list',
      name: 'Listar Controles de Ponto',
      description: 'Permite listar todos os registros de controle de ponto',
      module: 'hr',
      resource: 'time-control',
      action: 'list',
    },
    {
      code: 'hr.time-control.manage',
      name: 'Gerenciar Controles de Ponto',
      description: 'Permite gerenciar todas as operações de controle de ponto',
      module: 'hr',
      resource: 'time-control',
      action: 'manage',
    },

    // Vacation Periods
    {
      code: 'hr.vacation-periods.create',
      name: 'Criar Período de Férias',
      description: 'Permite criar períodos de férias',
      module: 'hr',
      resource: 'vacation-periods',
      action: 'create',
    },
    {
      code: 'hr.vacation-periods.read',
      name: 'Visualizar Período de Férias',
      description: 'Permite visualizar períodos de férias',
      module: 'hr',
      resource: 'vacation-periods',
      action: 'read',
    },
    {
      code: 'hr.vacation-periods.update',
      name: 'Atualizar Período de Férias',
      description: 'Permite atualizar períodos de férias',
      module: 'hr',
      resource: 'vacation-periods',
      action: 'update',
    },
    {
      code: 'hr.vacation-periods.delete',
      name: 'Excluir Período de Férias',
      description: 'Permite excluir períodos de férias',
      module: 'hr',
      resource: 'vacation-periods',
      action: 'delete',
    },
    {
      code: 'hr.vacation-periods.list',
      name: 'Listar Períodos de Férias',
      description: 'Permite listar todos os períodos de férias',
      module: 'hr',
      resource: 'vacation-periods',
      action: 'list',
    },
    {
      code: 'hr.vacation-periods.manage',
      name: 'Gerenciar Períodos de Férias',
      description: 'Permite gerenciar todas as operações de períodos de férias',
      module: 'hr',
      resource: 'vacation-periods',
      action: 'manage',
    },

    // Work Schedules
    {
      code: 'hr.work-schedules.create',
      name: 'Criar Escala de Trabalho',
      description: 'Permite criar escalas de trabalho',
      module: 'hr',
      resource: 'work-schedules',
      action: 'create',
    },
    {
      code: 'hr.work-schedules.read',
      name: 'Visualizar Escala de Trabalho',
      description: 'Permite visualizar escalas de trabalho',
      module: 'hr',
      resource: 'work-schedules',
      action: 'read',
    },
    {
      code: 'hr.work-schedules.update',
      name: 'Atualizar Escala de Trabalho',
      description: 'Permite atualizar escalas de trabalho',
      module: 'hr',
      resource: 'work-schedules',
      action: 'update',
    },
    {
      code: 'hr.work-schedules.delete',
      name: 'Excluir Escala de Trabalho',
      description: 'Permite excluir escalas de trabalho',
      module: 'hr',
      resource: 'work-schedules',
      action: 'delete',
    },
    {
      code: 'hr.work-schedules.list',
      name: 'Listar Escalas de Trabalho',
      description: 'Permite listar todas as escalas de trabalho',
      module: 'hr',
      resource: 'work-schedules',
      action: 'list',
    },
    {
      code: 'hr.work-schedules.manage',
      name: 'Gerenciar Escalas de Trabalho',
      description: 'Permite gerenciar todas as operações de escalas de trabalho',
      module: 'hr',
      resource: 'work-schedules',
      action: 'manage',
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
        description: 'Acesso completo ao sistema com todas as permissões.',
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
        description: 'Gerenciamento de estoque e vendas.',
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
    'stock.care.read',
    'stock.care.list',

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
        description: 'Acesso básico de leitura.',
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
    'stock.care.read',
    'stock.care.list',

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
  // 3. ATRIBUIR GRUPO PADRÃO A USUÁRIOS SEM GRUPO
  // =============================================

  console.log('🔄 Verificando usuários sem grupo de permissões...');

  // Buscar usuários que não têm nenhum grupo atribuído
  const usersWithoutGroup = await prisma.user.findMany({
    where: {
      deletedAt: null,
      permissionGroups: {
        none: {},
      },
    },
  });

  let assignedCount = 0;

  for (const user of usersWithoutGroup) {
    // Atribuir grupo padrão "user" para usuários sem grupo
    await prisma.userPermissionGroup.create({
      data: {
        userId: user.id,
        groupId: userGroup.id,
        grantedBy: null, // Sistema
      },
    });
    assignedCount++;
  }

  const totalUsers = await prisma.user.count({ where: { deletedAt: null } });

  console.log(`✅ ${assignedCount} usuários atribuídos ao grupo padrão`);
  console.log(`   - Total de usuários no sistema: ${totalUsers}\n`);

  // =============================================
  // 6. CRIAR ORGANIZATIONS (Companies, Suppliers, Manufacturers)
  // =============================================

  console.log('🏢 Criando organizações...');

  // Criar 1 Company (empresa própria)
  const company = await prisma.organization.create({
    data: {
      type: 'COMPANY',
      legalName: 'OpenSea Tecnologia LTDA',
      tradeName: 'OpenSea',
      cnpj: '12345678000190',
      stateRegistration: '123456789',
      taxRegime: 'SIMPLES',
      status: 'ACTIVE',
      email: 'contato@opensea.com.br',
      phoneMain: '(11) 98765-4321',
      website: 'https://opensea.com.br',
      typeSpecificData: {},
      metadata: {},
    },
  });

  // Criar endereço da company
  await prisma.organizationAddress.create({
    data: {
      organizationId: company.id,
      type: 'FISCAL',
      street: 'Av. Paulista',
      number: '1000',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zip: '01310-100',
      countryCode: 'BR',
      isPrimary: true,
    },
  });

  // Criar CNAE da company
  await prisma.organizationCnae.create({
    data: {
      organizationId: company.id,
      code: '6201-5/00',
      description: 'Desenvolvimento de programas de computador sob encomenda',
      isPrimary: true,
      status: 'ACTIVE',
    },
  });

  // Criar configurações fiscais da company
  await prisma.organizationFiscalSettings.create({
    data: {
      organizationId: company.id,
      nfeEnabled: true,
      nfeSeries: 1,
      nfeNumber: 1,
      nfeEnvironment: 'HOMOLOGATION',
      defaultIcmsRate: 18,
      defaultIpiRate: 0,
      defaultPisRate: 0.65,
      defaultCofinsRate: 3,
    },
  });

  // Criar stakeholder da company
  await prisma.organizationStakeholder.create({
    data: {
      organizationId: company.id,
      name: 'João da Silva',
      cpf: '12345678901',
      role: 'ADMINISTRADOR',
      qualification: 'Sócio Administrador',
      status: 'ACTIVE',
      source: 'MANUAL',
    },
  });

  // Criar 2 Suppliers (fornecedores)
  const supplier1 = await prisma.organization.create({
    data: {
      type: 'SUPPLIER',
      legalName: 'Tech Parts Distribuidora LTDA',
      tradeName: 'Tech Parts',
      cnpj: '98765432000111',
      taxRegime: 'LUCRO_PRESUMIDO',
      status: 'ACTIVE',
      email: 'vendas@techparts.com.br',
      phoneMain: '(11) 3333-4444',
      typeSpecificData: {
        paymentTerms: '30/60/90 dias',
        rating: 4.5,
        sequentialCode: 1,
      },
      metadata: {},
    },
  });

  await prisma.organizationAddress.create({
    data: {
      organizationId: supplier1.id,
      type: 'FISCAL',
      street: 'Rua das Flores',
      number: '500',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip: '01234-567',
      countryCode: 'BR',
      isPrimary: true,
    },
  });

  const supplier2 = await prisma.organization.create({
    data: {
      type: 'SUPPLIER',
      legalName: 'Componentes Eletrônicos S.A.',
      tradeName: 'Comp Eletro',
      cnpj: '11223344000155',
      taxRegime: 'LUCRO_REAL',
      status: 'ACTIVE',
      email: 'comercial@compeletro.com.br',
      phoneMain: '(11) 5555-6666',
      typeSpecificData: {
        paymentTerms: '30 dias',
        rating: 4.8,
        sequentialCode: 2,
      },
      metadata: {},
    },
  });

  await prisma.organizationAddress.create({
    data: {
      organizationId: supplier2.id,
      type: 'FISCAL',
      street: 'Av. Industrial',
      number: '2000',
      district: 'Distrito Industrial',
      city: 'Guarulhos',
      state: 'SP',
      zip: '07000-000',
      countryCode: 'BR',
      isPrimary: true,
    },
  });

  // Criar 2 Manufacturers (fabricantes)
  const manufacturer1 = await prisma.organization.create({
    data: {
      type: 'MANUFACTURER',
      legalName: 'Dell Technologies Brasil LTDA',
      tradeName: 'Dell',
      cnpj: '55667788000199',
      status: 'ACTIVE',
      email: 'contato@dell.com.br',
      phoneMain: '0800-123-4567',
      website: 'https://dell.com.br',
      typeSpecificData: {
        country: 'Brasil',
        rating: 4.7,
      },
      metadata: {},
    },
  });

  await prisma.organizationAddress.create({
    data: {
      organizationId: manufacturer1.id,
      type: 'FISCAL',
      street: 'Av. das Nações Unidas',
      number: '12901',
      district: 'Brooklin Paulista',
      city: 'São Paulo',
      state: 'SP',
      zip: '04578-000',
      countryCode: 'BR',
      isPrimary: true,
    },
  });

  const manufacturer2 = await prisma.organization.create({
    data: {
      type: 'MANUFACTURER',
      legalName: 'HP Brasil Indústria e Comércio LTDA',
      tradeName: 'HP',
      cnpj: '99887766000144',
      status: 'ACTIVE',
      email: 'contato@hp.com.br',
      phoneMain: '0800-765-4321',
      website: 'https://hp.com.br',
      typeSpecificData: {
        country: 'Brasil',
        rating: 4.6,
      },
      metadata: {},
    },
  });

  await prisma.organizationAddress.create({
    data: {
      organizationId: manufacturer2.id,
      type: 'FISCAL',
      street: 'Rua Arquiteto Olavo Redig de Campos',
      number: '105',
      district: 'Torre C',
      city: 'São Paulo',
      state: 'SP',
      zip: '04711-904',
      countryCode: 'BR',
      isPrimary: true,
    },
  });

  console.log('✅ Organizações criadas:');
  console.log(`   - 1 Company (OpenSea Tecnologia)`);
  console.log(`   - 2 Suppliers (Tech Parts, Comp Eletro)`);
  console.log(`   - 2 Manufacturers (Dell, HP)\n`);

  // =============================================
  // RESUMO
  // =============================================

  console.log('🎉 Seed concluído com sucesso!\n');
  console.log('📊 Resumo:');
  console.log(`   - ${permissions.length} permissões criadas`);
  console.log(`   - 3 grupos básicos criados (Admin, Manager, User)`);
  console.log(`   - 1 usuário admin criado (admin@teste.com)`);
  console.log(`   - ${assignedCount} usuários atribuídos ao grupo padrão`);
  console.log(`   - 5 organizações criadas (1 Company, 2 Suppliers, 2 Manufacturers)`);
  console.log('\n✅ Sistema RBAC e Organizations prontos para uso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
