import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface OffboardingChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
}

export interface OffboardingChecklistProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  terminationId?: UniqueEntityID | null;
  title: string;
  items: OffboardingChecklistItem[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class OffboardingChecklist extends Entity<OffboardingChecklistProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get terminationId(): UniqueEntityID | null | undefined {
    return this.props.terminationId;
  }

  get title(): string {
    return this.props.title;
  }

  get items(): OffboardingChecklistItem[] {
    return this.props.items;
  }

  get progress(): number {
    return this.props.progress;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  isComplete(): boolean {
    return this.progress === 100;
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  completeItem(itemId: string): void {
    const targetItem = this.props.items.find((item) => item.id === itemId);
    if (!targetItem) {
      throw new Error('Offboarding item not found');
    }
    if (targetItem.completed) {
      throw new Error('Offboarding item is already completed');
    }

    targetItem.completed = true;
    targetItem.completedAt = new Date();
    this.recalculateProgress();
    this.props.updatedAt = new Date();
  }

  updateTitle(newTitle: string): void {
    this.props.title = newTitle;
    this.props.updatedAt = new Date();
  }

  updateItems(newItems: OffboardingChecklistItem[]): void {
    this.props.items = newItems;
    this.recalculateProgress();
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  private recalculateProgress(): void {
    const totalItems = this.props.items.length;
    if (totalItems === 0) {
      this.props.progress = 100;
      return;
    }
    const completedItems = this.props.items.filter(
      (item) => item.completed,
    ).length;
    this.props.progress = Math.round((completedItems / totalItems) * 100);
  }

  private constructor(props: OffboardingChecklistProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<
      OffboardingChecklistProps,
      'createdAt' | 'updatedAt' | 'progress'
    > &
      Partial<
        Pick<OffboardingChecklistProps, 'createdAt' | 'updatedAt' | 'progress'>
      >,
    id?: UniqueEntityID,
  ): OffboardingChecklist {
    const now = new Date();
    const totalItems = props.items.length;
    const completedItems = props.items.filter((item) => item.completed).length;
    const progress =
      props.progress ??
      (totalItems === 0
        ? 100
        : Math.round((completedItems / totalItems) * 100));

    return new OffboardingChecklist(
      {
        ...props,
        title: props.title ?? 'Checklist de Desligamento',
        progress,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );
  }
}
