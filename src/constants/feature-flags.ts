/**
 * Feature flags de sistema disponíveis.
 * Cada flag controla uma funcionalidade que pode ser habilitada/desabilitada por tenant.
 */
export interface SystemFeatureFlag {
  flag: string;
  label: string;
  description: string;
  category: 'core' | 'stock' | 'sales' | 'hr' | 'experimental';
}

export const SYSTEM_FEATURE_FLAGS: SystemFeatureFlag[] = [
  // Core
  {
    flag: 'AUDIT_LOG',
    label: 'Log de Auditoria',
    description: 'Registra todas as ações dos usuários para auditoria',
    category: 'core',
  },
  {
    flag: 'TWO_FACTOR_AUTH',
    label: 'Autenticação em 2 Fatores',
    description: 'Exige verificação adicional no login dos usuários',
    category: 'core',
  },
  {
    flag: 'SECURITY_KEY',
    label: 'Chave de Segurança',
    description: 'Permite uso de PIN/chave para ações sensíveis',
    category: 'core',
  },

  // Stock
  {
    flag: 'BARCODE_SCANNING',
    label: 'Leitura de Código de Barras',
    description:
      'Habilita escaneamento via câmera e leitor de código de barras',
    category: 'stock',
  },
  {
    flag: 'LABEL_STUDIO',
    label: 'Studio de Etiquetas',
    description: 'Editor visual para criação de etiquetas customizadas',
    category: 'stock',
  },
  {
    flag: 'INVENTORY_CYCLES',
    label: 'Ciclos de Inventário',
    description: 'Permite criação de ciclos de contagem de inventário',
    category: 'stock',
  },
  {
    flag: 'STOCK_IMPORT',
    label: 'Importação de Estoque',
    description: 'Importação em massa de produtos via planilha',
    category: 'stock',
  },

  // Sales
  {
    flag: 'PROMOTIONS',
    label: 'Promoções',
    description: 'Sistema de descontos e promoções para vendas',
    category: 'sales',
  },
  {
    flag: 'RESERVATIONS',
    label: 'Reservas',
    description: 'Permite reservar itens do estoque para pedidos futuros',
    category: 'sales',
  },

  // HR
  {
    flag: 'PAYROLL',
    label: 'Folha de Pagamento',
    description: 'Cálculos automáticos de folha de pagamento',
    category: 'hr',
  },

  // Experimental
  {
    flag: 'AI_SUGGESTIONS',
    label: 'Sugestões com IA',
    description: 'Recomendações automáticas baseadas em padrões de uso',
    category: 'experimental',
  },
  {
    flag: 'ADVANCED_ANALYTICS',
    label: 'Análises Avançadas',
    description: 'Dashboards e relatórios com métricas avançadas',
    category: 'experimental',
  },
];

/**
 * Retorna as flags de sistema por categoria.
 */
export function getSystemFlagsByCategory(): Record<
  string,
  SystemFeatureFlag[]
> {
  const grouped: Record<string, SystemFeatureFlag[]> = {};
  for (const flag of SYSTEM_FEATURE_FLAGS) {
    if (!grouped[flag.category]) {
      grouped[flag.category] = [];
    }
    grouped[flag.category].push(flag);
  }
  return grouped;
}
