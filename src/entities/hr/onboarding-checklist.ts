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
  items: OnboardingChecklistItem[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export class OnboardingChecklist extends Entity<OnboardingChecklistProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
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

  isComplete(): boolean {
    return this.progress === 100;
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
    props: Omit<OnboardingChecklistProps, 'createdAt' | 'updatedAt' | 'progress'>,
    id?: UniqueEntityID,
  ): OnboardingChecklist {
    const now = new Date();
    const totalItems = props.items.length;
    const completedItems = props.items.filter((item) => item.completed).length;
    const progress =
      totalItems === 0
        ? 100
        : Math.round((completedItems / totalItems) * 100);

    return new OnboardingChecklist(
      {
        ...props,
        progress,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
