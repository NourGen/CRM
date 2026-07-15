import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Generated } from 'typeorm';

@Entity('academy_students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Permanent, sequential, human-facing client number — DB-native AUTO_INCREMENT, never reused even after deletes.
  // Internal relations still use `id` (uuid); this is purely the display/reference identifier.
  @Column({ name: 'client_number', type: 'int', unique: true })
  @Generated('increment')
  clientNumber: number;

  @Column({ name: 'legacy_id', type: 'varchar', nullable: true, unique: true })
  legacyId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'task_folder_id', type: 'varchar', nullable: true })
  taskFolderId: string;

  // Unnamed legacy sheet columns (8/9/10): instructor grouping, lecture access mode, financial OC link
  @Column({ name: 'instructor_tag', type: 'varchar', nullable: true })
  instructorTag: string;

  @Column({ name: 'access_mode', type: 'varchar', nullable: true })
  accessMode: string;

  @Column({ name: 'oc_code', type: 'varchar', nullable: true })
  ocCode: string;

  @Column({ name: 'profile_pic', type: 'mediumtext', nullable: true })
  profilePic: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;
}
