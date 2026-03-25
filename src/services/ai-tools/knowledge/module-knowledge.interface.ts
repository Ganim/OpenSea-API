// ============================================================
// Module Knowledge System ("SuperPowers")
// Structured domain documentation for AI-assisted decision-making
// ============================================================

/**
 * Root knowledge manifest for a business module.
 * Each module registers one of these to teach the AI about its domain.
 */
export interface ModuleKnowledge {
  /** Internal module key: 'stock', 'finance', 'hr', 'sales' */
  module: string;
  /** Localized display name: 'Estoque', 'Financeiro', 'RH', 'Vendas' */
  displayName: string;
  /** Brief module description (1-2 sentences) */
  description: string;
  /** Semantic version of this knowledge manifest */
  version: string;

  /** Entity map — every domain entity the module manages */
  entities: EntityKnowledge[];

  /** Workflows / pipelines — multi-step business processes */
  workflows: WorkflowKnowledge[];

  /** Business rules the AI must respect */
  rules: BusinessRule[];

  /** Decision trees — guide the AI when intent is ambiguous */
  decisionTrees: DecisionTree[];

  /** Data requirements — what data is needed for each action */
  dataRequirements: DataRequirement[];

  /** Cross-module dependencies */
  dependencies: ModuleDependency[];

  /** Common queries the AI should know how to answer */
  commonQueries: CommonQuery[];
}

// ============================================================
// Entity Knowledge
// ============================================================

export interface EntityKnowledge {
  /** Internal name: 'Product', 'Entry' */
  name: string;
  /** Localized display name: 'Produto', 'Lancamento' */
  displayName: string;
  /** What this entity represents */
  description: string;
  /** Key fields with descriptions */
  fields: FieldKnowledge[];
  /** Status transitions (if entity is stateful) */
  statusFlow?: StatusFlow;
  /** Relations to other entities */
  relationships: EntityRelation[];
  /** Key validation rules in natural language */
  validations: string[];
}

export interface FieldKnowledge {
  /** Field name as used in code/API */
  name: string;
  /** Localized display name */
  displayName: string;
  /** Data type */
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'enum'
    | 'relation'
    | 'object'
    | 'array';
  /** Whether the field is required for creation */
  required: boolean;
  /** What this field means */
  description: string;
  /** For enum fields — allowed values */
  enumValues?: string[];
  /** Default value (as string) */
  defaultValue?: string;
  /** Example value */
  example?: string;
}

export interface StatusFlow {
  /** All possible statuses */
  statuses: string[];
  /** Allowed transitions: key = fromStatus, value = toStatuses[] */
  transitions: Record<string, string[]>;
  /** Initial status when entity is created */
  initialStatus: string;
  /** Terminal statuses (no further transitions) */
  terminalStatuses: string[];
}

export interface EntityRelation {
  /** Target entity name */
  entity: string;
  /** Relation type */
  type: 'belongs_to' | 'has_many' | 'many_to_many';
  /** Natural language description */
  description: string;
  /** Whether the relation is required */
  required: boolean;
}

// ============================================================
// Workflow Knowledge
// ============================================================

export interface WorkflowKnowledge {
  /** Internal name: 'order_fulfillment' */
  name: string;
  /** Localized display name: 'Fluxo de Pedido' */
  displayName: string;
  /** What this workflow does */
  description: string;
  /** Ordered steps */
  steps: WorkflowStep[];
  /** What triggers this workflow */
  triggers: string[];
  /** Possible end states */
  outcomes: string[];
}

export interface WorkflowStep {
  /** Step order (1-based) */
  order: number;
  /** Step name */
  name: string;
  /** What happens at this step */
  description: string;
  /** Fields / data needed */
  requiredData: string[];
  /** Actions the AI can take automatically (no user confirmation) */
  autoActions: string[];
  /** Actions that require user confirmation */
  confirmActions: string[];
  /** Possible next steps (by name) */
  nextSteps: string[];
  /** What to do if this step fails */
  errorHandling: string;
}

// ============================================================
// Business Rules
// ============================================================

export interface BusinessRule {
  /** Unique rule identifier */
  id: string;
  /** Natural language description */
  description: string;
  /** Severity level */
  severity: 'BLOCK' | 'WARN' | 'INFO';
  /** Entity/action names this rule applies to */
  appliesTo: string[];
  /** When this rule is triggered */
  condition: string;
  /** What the AI should do */
  action: string;
}

// ============================================================
// Decision Trees
// ============================================================

export interface DecisionTree {
  /** The question the AI needs to answer */
  question: string;
  /** When to use this tree */
  context: string;
  /** Possible branches */
  branches: DecisionBranch[];
}

export interface DecisionBranch {
  /** Condition description */
  condition: string;
  /** Action to take */
  action: string;
  /** Which tool to call (if applicable) */
  toolToUse?: string;
  /** Nested decision (for multi-level trees) */
  followUp?: DecisionTree;
}

// ============================================================
// Data Requirements
// ============================================================

export interface DataRequirement {
  /** Action name: 'create_product', 'register_entry' */
  action: string;
  /** Fields that must be provided */
  required: RequiredField[];
  /** Fields that are optional but useful */
  optional: RequiredField[];
  /** Fields the AI can figure out from context */
  derivable: DerivableField[];
}

export interface RequiredField {
  /** Field name */
  field: string;
  /** What this field is for */
  description: string;
  /** How to obtain: 'ask_user', 'lookup_entity', 'use_default' */
  howToObtain: 'ask_user' | 'lookup_entity' | 'use_default';
}

export interface DerivableField {
  /** Field name */
  field: string;
  /** What this field is for */
  description: string;
  /** How the AI should derive this value */
  derivationStrategy: string;
}

// ============================================================
// Module Dependencies
// ============================================================

export interface ModuleDependency {
  /** Target module name */
  module: string;
  /** Description of how they interact */
  relationship: string;
  /** Entities shared across modules */
  sharedEntities: string[];
}

// ============================================================
// Common Queries
// ============================================================

export interface CommonQuery {
  /** Intent identifier: 'check_stock_level' */
  intent: string;
  /** Example phrases the user might say */
  examples: string[];
  /** Strategy for answering */
  strategy: string;
  /** Which tools to call */
  toolsNeeded: string[];
}
