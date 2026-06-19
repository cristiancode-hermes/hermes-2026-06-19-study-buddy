import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Deck } from '../../modules/decks/deck.entity';
import { StudyReview } from '../../modules/study/study-review.entity';

@Entity('flashcards')
export class Flashcard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  deckId: number;

  @ManyToOne(() => Deck, (deck) => deck.flashcards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deckId' })
  deck: Deck;

  @Column({ type: 'text' })
  front: string;

  @Column({ type: 'text' })
  back: string;

  @Column({ default: 0 })
  position: number;

  @OneToMany(() => StudyReview, (review) => review.flashcard)
  reviews: StudyReview[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
