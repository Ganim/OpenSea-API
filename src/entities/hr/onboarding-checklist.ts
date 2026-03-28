import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
}

export interface OnboardingChecklistProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  title: string;
  items: OnboardingChecklistItem[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class OnboardingChecklist extends Entity<OnboardingChecklistProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get title(): string {
    return this.props.title;
  }

  get items(): OnboardingChecklistItem[] {
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
      throw new Error('Onboarding item not found');
    }
    if (targetItem.completed) {
      throw new Error('Onboarding item is already completed');
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

  updateItems(newItems: OnboardingChecklistItem[]): void {
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

  private constructor(props: OnboardingChecklistProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<
      OnboardingChecklistProps,
      'createdAt' | 'updatedAt' | 'progress'
    > &
      Partial<
        Pick<OnboardingChecklistProps, 'createdAt' | 'updatedAt' | 'progress'>
      >,
    id?: UniqueEntityID,
  ): OnboardingChecklist {
    const now = new Date();
    const totalItems = props.items.length;
    const completedItems = props.items.filter((item) => item.completed).length;
    const progress =
      props.progress ??
      (totalItems === 0
        ? 100
        : Math.round((completedItems / totalItems) * 100));

    return new OnboardingChecklist(
      {
        ...props,
        title: props.title ?? 'Onboarding',
        progress,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );
  }
}
