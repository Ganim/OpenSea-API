import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface AnnouncementReadReceiptProps {
  tenantId: UniqueEntityID;
  announcementId: UniqueEntityID;
  employeeId: UniqueEntityID;
  readAt: Date;
}

/**
 * Persistent record that a given {@link Employee} has read a specific
 * {@link CompanyAnnouncement}. The pair `(announcementId, employeeId)` is
 * unique on the database, so creation is naturally idempotent.
 */
export class AnnouncementReadReceipt extends Entity<AnnouncementReadReceiptProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get announcementId(): UniqueEntityID {
    return this.props.announcementId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get readAt(): Date {
    return this.props.readAt;
  }

  private constructor(
    props: AnnouncementReadReceiptProps,
    id?: UniqueEntityID,
  ) {
    super(props, id);
  }

  static create(
    props: Partial<Pick<AnnouncementReadReceiptProps, 'readAt'>> &
      Omit<AnnouncementReadReceiptProps, 'readAt'>,
    id?: UniqueEntityID,
  ): AnnouncementReadReceipt {
    return new AnnouncementReadReceipt(
      {
        ...props,
        readAt: props.readAt ?? new Date(),
      },
      id,
    );
  }
}
