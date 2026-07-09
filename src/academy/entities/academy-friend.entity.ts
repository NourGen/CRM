import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('academy_friends')
export class AcademyFriend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_legacy_id', type: 'varchar', nullable: true })
  userLegacyId: string;

  @Column({ name: 'friend_legacy_id', type: 'varchar', nullable: true })
  friendLegacyId: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
