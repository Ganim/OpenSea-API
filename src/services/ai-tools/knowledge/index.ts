export type {
  ModuleKnowledge,
  EntityKnowledge,
  FieldKnowledge,
  StatusFlow,
  EntityRelation,
  WorkflowKnowledge,
  WorkflowStep,
  BusinessRule,
  DecisionTree,
  DecisionBranch,
  DataRequirement,
  RequiredField,
  DerivableField,
  ModuleDependency,
  CommonQuery,
} from './module-knowledge.interface';

export { KnowledgeRegistry } from './knowledge-registry';
export { KnowledgePromptBuilder } from './knowledge-prompt-builder';

// Module knowledge manifests
export { stockKnowledge } from './modules/stock-knowledge';
export { financeKnowledge } from './modules/finance-knowledge';
export { hrKnowledge } from './modules/hr-knowledge';
export { salesKnowledge } from './modules/sales-knowledge';
