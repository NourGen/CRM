import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('academy_reactions')
export class AcademyReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true })
  legacyId: string;

  @Column({ name: 'item_type', type: 'varchar' }) // e.g. 'post' / 'comment' / 'story'
  itemType: string;

  @Column({ name: 'item_id', type: 'varchar' }) // legacy ID of the item
  itemId: string;

  @Column({ name: 'user_id', type: 'varchar', nullable: true }) // legacy ID of the user (Student/User/Instructor)
  userId: string;

  @Column({ name: 'reaction_type', type: 'varchar', nullable: true })
  reactionType: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
