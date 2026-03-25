import type { ToolDefinition, ToolCall } from './tool-types';
import { randomUUID } from 'node:crypto';

// ── Display Name Map ──────────────────────────────────────────────────────

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  // Stock
  stock_register_entry: 'Registrar Entrada de Estoque',
  stock_register_exit: 'Registrar Saída de Estoque',
  stock_transfer_item: 'Transferir Item entre Armazéns',
  stock_create_product: 'Cadastrar Produto',
  stock_update_product: 'Atualizar Produto',
  stock_create_variant: 'Criar Variante de Produto',
  stock_update_variant: 'Atualizar Variante',
  stock_create_category: 'Criar Categoria',
  stock_create_template: 'Criar Template de Produto',
  stock_create_supplier: 'Cadastrar Fornecedor',
  stock_create_manufacturer: 'Cadastrar Fabricante',
  stock_create_purchase_order: 'Criar Ordem de Compra',
  stock_create_tag: 'Criar Tag de Produto',

  // Finance
  finance_create_entry: 'Criar Lançamento Financeiro',
  finance_register_payment: 'Registrar Pagamento',
  finance_cancel_entry: 'Cancelar Lançamento',

  // HR
  hr_register_employee: 'Cadastrar Funcionário',
  hr_update_employee: 'Atualizar Funcionário',
  hr_register_absence: 'Registrar Afastamento',
  hr_schedule_vacation: 'Agendar Férias',
  hr_approve_absence: 'Aprovar Afastamento',

  // Sales
  sales_create_order: 'Criar Pedido de Venda',
  sales_confirm_order: 'Confirmar Pedido',
  sales_cancel_order: 'Cancelar Pedido',
  sales_reserve_item: 'Reservar Item',
  sales_cancel_reservation: 'Cancelar Reserva',
};

// ── Field Extraction ──────────────────────────────────────────────────────

interface ActionCardField {
  label: string;
  value: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge';
}

/** Maps tool argument keys to human-readable labels + display type */
const FIELD_LABELS: Record<
  string,
  { label: string; type?: ActionCardField['type'] }
> = {
  name: { label: 'Nome' },
  description: { label: 'Descrição' },
  productId: { label: 'Produto (ID)' },
  variantId: { label: 'Variante (ID)' },
  warehouseId: { label: 'Armazém (ID)' },
  fromWarehouseId: { label: 'Armazém de Origem (ID)' },
  toWarehouseId: { label: 'Armazém de Destino (ID)' },
  quantity: { label: 'Quantidade', type: 'number' },
  unitCost: { label: 'Custo Unitário', type: 'currency' },
  price: { label: 'Preço', type: 'currency' },
  costPrice: { label: 'Preço de Custo', type: 'currency' },
  reason: { label: 'Motivo', type: 'badge' },
  status: { label: 'Status', type: 'badge' },
  supplierId: { label: 'Fornecedor (ID)' },
  categoryId: { label: 'Categoria (ID)' },
  manufacturerId: { label: 'Fabricante (ID)' },
  notes: { label: 'Observações' },
  sku: { label: 'SKU' },
  email: { label: 'E-mail' },
  phone: { label: 'Telefone' },
  cnpj: { label: 'CNPJ' },
  tradeName: { label: 'Nome Fantasia' },
  expectedDate: { label: 'Data Prevista', type: 'date' },
  startDate: { label: 'Data de Início', type: 'date' },
  endDate: { label: 'Data de Fim', type: 'date' },
  amount: { label: 'Valor', type: 'currency' },
  entryId: { label: 'Lançamento (ID)' },
  employeeId: { label: 'Funcionário (ID)' },
  departmentId: { label: 'Departamento (ID)' },
  position: { label: 'Cargo' },
  salary: { label: 'Salário', type: 'currency' },
  weeklyHours: { label: 'Horas Semanais', type: 'number' },
  cid: { label: 'CID' },
  type: { label: 'Tipo', type: 'badge' },
  customerId: { label: 'Cliente (ID)' },
  pipelineId: { label: 'Pipeline (ID)' },
  stageId: { label: 'Estágio (ID)' },
  orderId: { label: 'Pedido (ID)' },
  itemId: { label: 'Item (ID)' },
  reservationId: { label: 'Reserva (ID)' },
  absenceId: { label: 'Afastamento (ID)' },
  vacationPeriodId: { label: 'Período de Férias (ID)' },
  binId: { label: 'Posição de Armazenamento (ID)' },
  fromBinId: { label: 'Posição de Origem (ID)' },
  toBinId: { label: 'Posição de Destino (ID)' },
  purchaseOrderId: { label: 'Ordem de Compra (ID)' },
};

/** Maps tool module names to entity type for the action log */
const MODULE_ENTITY_MAP: Record<string, string> = {
  stock_register_entry: 'stock-movement',
  stock_register_exit: 'stock-movement',
  stock_transfer_item: 'stock-movement',
  stock_create_product: 'product',
  stock_update_product: 'product',
  stock_create_variant: 'variant',
  stock_update_variant: 'variant',
  stock_create_category: 'category',
  stock_create_template: 'template',
  stock_create_supplier: 'supplier',
  stock_create_manufacturer: 'manufacturer',
  stock_create_purchase_order: 'purchase-order',
  stock_create_tag: 'tag',
  finance_create_entry: 'financial-entry',
  finance_register_payment: 'financial-entry',
  finance_cancel_entry: 'financial-entry',
  hr_register_employee: 'employee',
  hr_update_employee: 'employee',
  hr_register_absence: 'absence',
  hr_schedule_vacation: 'vacation',
  hr_approve_absence: 'absence',
  sales_create_order: 'order',
  sales_confirm_order: 'order',
  sales_cancel_order: 'order',
  sales_reserve_item: 'reservation',
  sales_cancel_reservation: 'reservation',
};

// ── Action Card Builder ───────────────────────────────────────────────────

export interface ActionCardRenderData {
  type: 'ACTION_CARD';
  actionId: string;
  toolName: string;
  displayName: string;
  module: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXECUTED' | 'FAILED';
  fields: ActionCardField[];
}

export interface PendingActionData {
  actionId: string;
  toolName: string;
  module: string;
  entityType: string;
  args: Record<string, unknown>;
  renderData: ActionCardRenderData;
}

/**
 * Extracts human-readable fields from tool call arguments for ACTION_CARD display.
 */
function extractFields(args: Record<string, unknown>): ActionCardField[] {
  const fields: ActionCardField[] = [];

  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null) continue;

    // Skip complex objects (arrays, nested objects) — display them as JSON summary
    if (Array.isArray(value)) {
      fields.push({
        label: FIELD_LABELS[key]?.label ?? key,
        value: `${value.length} item(s)`,
        type: 'text',
      });
      continue;
    }

    if (typeof value === 'object') {
      fields.push({
        label: FIELD_LABELS[key]?.label ?? key,
        value: JSON.stringify(value).slice(0, 100),
        type: 'text',
      });
      continue;
    }

    const config = FIELD_LABELS[key];
    fields.push({
      label: config?.label ?? key,
      value: String(value),
      type: config?.type ?? 'text',
    });
  }

  return fields;
}

/**
 * Builds an ACTION_CARD render data object for a tool that requires confirmation.
 */
export function buildPendingAction(
  toolCall: ToolCall,
  tool: ToolDefinition,
): PendingActionData {
  const actionId = randomUUID();
  const displayName = TOOL_DISPLAY_NAMES[toolCall.name] ?? tool.description;
  const entityType = MODULE_ENTITY_MAP[toolCall.name] ?? 'unknown';

  const renderData: ActionCardRenderData = {
    type: 'ACTION_CARD',
    actionId,
    toolName: toolCall.name,
    displayName,
    module: tool.module,
    status: 'PENDING',
    fields: extractFields(toolCall.arguments),
  };

  return {
    actionId,
    toolName: toolCall.name,
    module: tool.module,
    entityType,
    args: toolCall.arguments,
    renderData,
  };
}

/**
 * Gets the display name for a tool.
 */
export function getToolDisplayName(toolName: string): string {
  return TOOL_DISPLAY_NAMES[toolName] ?? toolName;
}
