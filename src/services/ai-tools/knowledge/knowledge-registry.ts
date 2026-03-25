import type {
  ModuleKnowledge,
  DataRequirement,
  CommonQuery,
} from './module-knowledge.interface';

/**
 * Central registry for all module knowledge manifests.
 * Collects, stores, and retrieves structured domain knowledge
 * that the AI uses for decision-making.
 */
export class KnowledgeRegistry {
  private modules: Map<string, ModuleKnowledge> = new Map();

  /**
   * Register a module's knowledge manifest.
   */
  register(knowledge: ModuleKnowledge): void {
    this.modules.set(knowledge.module, knowledge);
  }

  /**
   * Register multiple module knowledge manifests.
   */
  registerMany(knowledgeList: ModuleKnowledge[]): void {
    for (const k of knowledgeList) {
      this.register(k);
    }
  }

  /**
   * Get knowledge for a specific module.
   */
  getModule(module: string): ModuleKnowledge | undefined {
    return this.modules.get(module);
  }

  /**
   * Get knowledge for multiple modules.
   */
  getModules(modules: string[]): ModuleKnowledge[] {
    return modules
      .map((m) => this.modules.get(m))
      .filter((k): k is ModuleKnowledge => k !== undefined);
  }

  /**
   * Get all registered module names.
   */
  getRegisteredModules(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Get all registered knowledge manifests.
   */
  getAllKnowledge(): ModuleKnowledge[] {
    return Array.from(this.modules.values());
  }

  /**
   * Determine which modules are relevant based on user permissions.
   * Returns module keys for which the user has at least one permission.
   */
  getRelevantModules(userPermissions: string[]): string[] {
    const moduleKeys = new Set<string>();

    for (const perm of userPermissions) {
      // Permission format: module.resource.action or module.group.resource.action
      const parts = perm.split('.');
      if (parts.length >= 3) {
        const moduleKey = parts[0];
        if (this.modules.has(moduleKey)) {
          moduleKeys.add(moduleKey);
        }
      }
    }

    return Array.from(moduleKeys);
  }

  /**
   * Find the most relevant modules based on user message intent.
   * Performs keyword matching against common queries and entity names.
   */
  getModulesByIntent(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const scores: Map<string, number> = new Map();

    for (const [key, knowledge] of this.modules) {
      let score = 0;

      // Check common queries
      for (const query of knowledge.commonQueries) {
        for (const example of query.examples) {
          if (lowerMessage.includes(example.toLowerCase())) {
            score += 10;
          }
          // Partial word matching
          const words = example.toLowerCase().split(/\s+/);
          for (const word of words) {
            if (word.length > 3 && lowerMessage.includes(word)) {
              score += 2;
            }
          }
        }
      }

      // Check entity display names
      for (const entity of knowledge.entities) {
        if (lowerMessage.includes(entity.displayName.toLowerCase())) {
          score += 8;
        }
      }

      // Check workflow triggers
      for (const workflow of knowledge.workflows) {
        for (const trigger of workflow.triggers) {
          const triggerWords = trigger.toLowerCase().split(/\s+/);
          let triggerMatch = 0;
          for (const word of triggerWords) {
            if (word.length > 3 && lowerMessage.includes(word)) {
              triggerMatch++;
            }
          }
          if (triggerMatch >= 2) {
            score += 5;
          }
        }
      }

      // Check module display name
      if (lowerMessage.includes(knowledge.displayName.toLowerCase())) {
        score += 15;
      }

      if (score > 0) {
        scores.set(key, score);
      }
    }

    // Sort by score descending, return top matches
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);
  }

  /**
   * Get data requirements for a specific action across all modules.
   */
  getDataRequirements(action: string): DataRequirement | undefined {
    for (const knowledge of this.modules.values()) {
      const req = knowledge.dataRequirements.find((r) => r.action === action);
      if (req) return req;
    }
    return undefined;
  }

  /**
   * Find common queries matching a user message.
   * Returns the best matching query with its module context.
   */
  findMatchingQueries(
    message: string,
  ): Array<{ module: string; query: CommonQuery; score: number }> {
    const lowerMessage = message.toLowerCase();
    const matches: Array<{
      module: string;
      query: CommonQuery;
      score: number;
    }> = [];

    for (const [moduleKey, knowledge] of this.modules) {
      for (const query of knowledge.commonQueries) {
        let score = 0;
        for (const example of query.examples) {
          const exampleLower = example.toLowerCase();
          if (lowerMessage.includes(exampleLower)) {
            score += 10;
          } else {
            const words = exampleLower.split(/\s+/);
            let matchCount = 0;
            for (const word of words) {
              if (word.length > 3 && lowerMessage.includes(word)) {
                matchCount++;
              }
            }
            if (matchCount > 0) {
              score += matchCount * 2;
            }
          }
        }

        if (score > 0) {
          matches.push({ module: moduleKey, query, score });
        }
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Validate if all required data is available for an action.
   * Returns missing required fields.
   */
  validateDataForAction(
    action: string,
    providedData: Record<string, unknown>,
  ): { valid: boolean; missingFields: string[]; derivableFields: string[] } {
    const requirement = this.getDataRequirements(action);

    if (!requirement) {
      return { valid: true, missingFields: [], derivableFields: [] };
    }

    const missingFields: string[] = [];
    const derivableFields: string[] = [];

    for (const req of requirement.required) {
      if (
        providedData[req.field] === undefined ||
        providedData[req.field] === null ||
        providedData[req.field] === ''
      ) {
        // Check if it's derivable
        const isDerived = requirement.derivable.some(
          (d) => d.field === req.field,
        );
        if (isDerived) {
          derivableFields.push(req.field);
        } else {
          missingFields.push(req.field);
        }
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields,
      derivableFields,
    };
  }
}
