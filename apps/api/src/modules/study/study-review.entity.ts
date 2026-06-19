import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Flashcard } from '../../modules/flashcards/flashcard.entity';

@Entity('study_reviews')
export class StudyReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  flashcardId: number;

  @ManyToOne(() => Flashcard, (flashcard) => flashcard.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'flashcardId' })
  flashcard: Flashcard;

  @Column()
  userId: number;

  @Column()
  quality: number;

  @Column({ type: 'real', default: 2.5 })
  easeFactor: number;

  @Column({ default: 0 })
  interval: number;

  @Column({ default: 0 })
  repetitions: number;

  @Column({ type: 'date' })
  nextReview: string;

  @CreateDateColumn()
  reviewedAt: Date;
}
