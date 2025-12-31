/**
 * Care Instructions Value Object
 *
 * Represents a collection of care instruction IDs associated with a product.
 * Ensures no duplicates and maintains stable order.
 *
 * This value object is domain-agnostic and does not know about:
 * - The manifest.json file
 * - The filesystem
 * - The validation of IDs against the catalog
 *
 * ID validation should be done at the application layer (use-cases).
 */

export class CareInstructions {
  private readonly instructionIds: readonly string[];

  private constructor(instructionIds: string[]) {
    this.instructionIds = Object.freeze(instructionIds);
  }

  /**
   * Create a CareInstructions value object from an array of IDs.
   * Automatically removes duplicates while preserving order.
   */
  static create(ids: string[]): CareInstructions {
    // Remove duplicates while preserving order
    const uniqueIds = [...new Set(ids)];
    return new CareInstructions(uniqueIds);
  }

  /**
   * Create an empty CareInstructions value object
   */
  static empty(): CareInstructions {
    return new CareInstructions([]);
  }

  /**
   * Get the array of instruction IDs
   */
  get ids(): readonly string[] {
    return this.instructionIds;
  }

  /**
   * Get the array as a mutable copy (for persistence)
   */
  toArray(): string[] {
    return [...this.instructionIds];
  }

  /**
   * Check if the collection is empty
   */
  get isEmpty(): boolean {
    return this.instructionIds.length === 0;
  }

  /**
   * Get the number of instructions
   */
  get count(): number {
    return this.instructionIds.length;
  }

  /**
   * Check if a specific instruction ID is included
   */
  includes(id: string): boolean {
    return this.instructionIds.includes(id);
  }

  /**
   * Add an instruction ID (returns new instance)
   */
  add(id: string): CareInstructions {
    if (this.includes(id)) {
      return this;
    }
    return new CareInstructions([...this.instructionIds, id]);
  }

  /**
   * Remove an instruction ID (returns new instance)
   */
  remove(id: string): CareInstructions {
    if (!this.includes(id)) {
      return this;
    }
    return new CareInstructions(
      this.instructionIds.filter((existingId) => existingId !== id),
    );
  }

  /**
   * Check equality with another CareInstructions
   */
  equals(other: CareInstructions): boolean {
    if (this.instructionIds.length !== other.instructionIds.length) {
      return false;
    }

    for (let i = 0; i < this.instructionIds.length; i++) {
      if (this.instructionIds[i] !== other.instructionIds[i]) {
        return false;
      }
    }

    return true;
  }
}
