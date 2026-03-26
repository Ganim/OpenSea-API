import type { ToolDefinition } from '@/services/ai-tools/tool-types';

export function getCrossModuleTools(): ToolDefinition[] {
  return [
    {
      name: 'atlas_search_entities',
      description:
        'Busca textual em entidades de qualquer modulo do sistema. Util para encontrar produtos, clientes, funcionarios, lancamentos por nome ou termo.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Termo de busca' },
          modules: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['stock', 'finance', 'hr', 'sales'],
            },
            description: 'Modulos para buscar (vazio = todos acessiveis)',
          },
          entityTypes: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Tipos de entidade (products, employees, entries, orders, etc)',
          },
          limit: {
            type: 'number',
            description: 'Maximo de resultados por entidade (padrao 10)',
          },
        },
        required: ['query'],
      },
      module: 'system',
      permission: 'system.ai.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'atlas_get_business_kpis',
      description:
        'Obtem KPIs de negocio dos modulos solicitados com comparacao temporal opcional. Retorna metricas como totais, contagens, valores agregados por periodo.',
      parameters: {
        type: 'object',
        properties: {
          modules: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['stock', 'finance', 'hr', 'sales'],
            },
            description: 'Modulos para obter KPIs (vazio = todos acessiveis)',
          },
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'quarter', 'year'],
            description: 'Periodo de referencia (padrao: month)',
          },
          compareWithPrevious: {
            type: 'boolean',
            description:
              'Se deve comparar com o periodo anterior (padrao: false)',
          },
        },
      },
      module: 'system',
      permission: 'system.ai.access',
      requiresConfirmation: false,
      category: 'report',
    },
    {
      name: 'atlas_cross_module_query',
      description:
        'Executa consultas que cruzam dados entre dois modulos. Exemplos: top produtos por receita (stock+sales), correlacao vendas/pagamentos (sales+finance).',
      parameters: {
        type: 'object',
        properties: {
          primaryModule: {
            type: 'string',
            enum: ['stock', 'finance', 'hr', 'sales'],
            description: 'Modulo principal da consulta',
          },
          secondaryModule: {
            type: 'string',
            enum: ['stock', 'finance', 'hr', 'sales'],
            description: 'Modulo secundario para cruzamento',
          },
          queryType: {
            type: 'string',
            enum: ['top_by_metric', 'correlation', 'breakdown'],
            description: 'Tipo de consulta a realizar',
          },
          metric: {
            type: 'string',
            description:
              'Metrica a analisar (revenue, quantity, payment_rate, order_items)',
          },
          groupBy: {
            type: 'string',
            description: 'Campo para agrupamento (opcional)',
          },
          limit: {
            type: 'number',
            description: 'Maximo de resultados (padrao 10)',
          },
          period: {
            type: 'string',
            description: 'Periodo de referencia em ISO 8601 (opcional)',
          },
        },
        required: ['primaryModule', 'secondaryModule', 'queryType', 'metric'],
      },
      module: 'system',
      permission: 'system.ai.access',
      requiresConfirmation: false,
      category: 'query',
    },
    {
      name: 'atlas_refresh_snapshot',
      description:
        'Forca a geracao de um novo snapshot de dados do tenant, invalidando o cache. Retorna o snapshot atualizado filtrado pelas permissoes do usuario.',
      parameters: {
        type: 'object',
        properties: {
          includeModules: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['stock', 'finance', 'hr', 'sales'],
            },
            description:
              'Modulos a incluir no snapshot (vazio = todos acessiveis)',
          },
        },
      },
      module: 'system',
      permission: 'system.ai.access',
      requiresConfirmation: false,
      category: 'query',
    },
  ];
}
