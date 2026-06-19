import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../modules/users/user.entity';
import { Deck } from '../modules/decks/deck.entity';
import { Flashcard } from '../modules/flashcards/flashcard.entity';
import { StudyReview } from '../modules/study/study-review.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Deck)
    private readonly decksRepository: Repository<Deck>,
    @InjectRepository(Flashcard)
    private readonly flashcardsRepository: Repository<Flashcard>,
    @InjectRepository(StudyReview)
    private readonly studyReviewsRepository: Repository<StudyReview>,
  ) {}

  async seed() {
    const existingUsers = await this.usersRepository.count();
    if (existingUsers > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding database...');

    // Create users
    const passwordHash = await bcrypt.hash('password123', 10);
    const user1 = await this.usersRepository.save(
      this.usersRepository.create({
        email: 'test@test.com',
        passwordHash,
        name: 'Test User',
      }),
    );
    const user2 = await this.usersRepository.save(
      this.usersRepository.create({
        email: 'student@test.com',
        passwordHash,
        name: 'Student User',
      }),
    );

    // Create decks for user1
    const deck1 = await this.decksRepository.save(
      this.decksRepository.create({
        userId: user1.id,
        name: 'JavaScript Fundamentals',
        description: 'Core JavaScript concepts and syntax',
      }),
    );
    const deck2 = await this.decksRepository.save(
      this.decksRepository.create({
        userId: user1.id,
        name: 'Data Structures & Algorithms',
        description: 'Common DSA patterns and implementations',
      }),
    );
    const deck3 = await this.decksRepository.save(
      this.decksRepository.create({
        userId: user1.id,
        name: 'TypeScript Basics',
        description: 'TypeScript type system and features',
      }),
    );

    // Create flashcards for deck1 (JavaScript)
    const jsCards = [
      { front: 'What is closure in JavaScript?', back: 'A function that has access to its outer function scope even after the outer function has returned.' },
      { front: 'What is the difference between == and ===?', back: '== compares values with type coercion; === compares values and types without coercion.' },
      { front: 'What is hoisting?', back: 'JavaScript behavior where variable and function declarations are moved to the top of their scope before code execution.' },
      { front: 'What is a Promise?', back: 'An object representing the eventual completion or failure of an asynchronous operation.' },
      { front: 'What is the event loop?', back: 'A mechanism that handles asynchronous callbacks by checking the call stack and task queue.' },
    ];
    for (let i = 0; i < jsCards.length; i++) {
      await this.flashcardsRepository.save(
        this.flashcardsRepository.create({ deckId: deck1.id, ...jsCards[i], position: i }),
      );
    }

    // Create flashcards for deck2 (DSA)
    const dsaCards = [
      { front: 'What is Big O notation?', back: 'A mathematical notation describing the limiting behavior of a function when the argument tends toward infinity.' },
      { front: 'What is a linked list?', back: 'A linear data structure where elements are stored in nodes that point to the next node.' },
      { front: 'What is a binary search tree?', back: 'A tree data structure where each node has at most 2 children, with left < parent < right.' },
      { front: 'What is dynamic programming?', back: 'A method for solving complex problems by breaking them down into simpler subproblems.' },
      { front: 'What is a hash table?', back: 'A data structure that maps keys to values using a hash function for O(1) average lookup.' },
    ];
    for (let i = 0; i < dsaCards.length; i++) {
      await this.flashcardsRepository.save(
        this.flashcardsRepository.create({ deckId: deck2.id, ...dsaCards[i], position: i }),
      );
    }

    // Create flashcards for deck3 (TypeScript)
    const tsCards = [
      { front: 'What is an interface in TypeScript?', back: 'A way to define the shape of an object, specifying property names and their types.' },
      { front: 'What is a generic?', back: 'A way to create reusable components that work with a variety of types rather than a single one.' },
      { front: 'What is the difference between any and unknown?', back: 'any bypasses type checking; unknown requires type assertion before use.' },
      { front: 'What is a type guard?', back: 'A runtime check that ensures a variable is of a specific type within a conditional block.' },
      { front: 'What are union and intersection types?', back: 'Union (|) allows a value to be one of several types; Intersection (&) combines multiple types into one.' },
    ];
    for (let i = 0; i < tsCards.length; i++) {
      await this.flashcardsRepository.save(
        this.flashcardsRepository.create({ deckId: deck3.id, ...tsCards[i], position: i }),
      );
    }

    // Create some study reviews for user1 (SM-2 demo)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const jsFlashcards = await this.flashcardsRepository.find({ where: { deckId: deck1.id } });

    // Create reviews with varying quality to demonstrate SM-2
    if (jsFlashcards.length >= 3) {
      // Card 0: Quality 5 (Easy) - should have long interval
      await this.studyReviewsRepository.save(
        this.studyReviewsRepository.create({
          flashcardId: jsFlashcards[0].id,
          userId: user1.id,
          quality: 5,
          easeFactor: 2.6,
          interval: 6,
          repetitions: 2,
          nextReview: new Date(today.getTime() + 6 * 86400000).toISOString().split('T')[0],
          reviewedAt: yesterday,
        }),
      );

      // Card 1: Quality 3 (Medium) - moderate interval
      await this.studyReviewsRepository.save(
        this.studyReviewsRepository.create({
          flashcardId: jsFlashcards[1].id,
          userId: user1.id,
          quality: 3,
          easeFactor: 2.5,
          interval: 3,
          repetitions: 1,
          nextReview: today.toISOString().split('T')[0],
          reviewedAt: threeDaysAgo,
        }),
      );

      // Card 2: Quality 0 (Difficult) - reset
      await this.studyReviewsRepository.save(
        this.studyReviewsRepository.create({
          flashcardId: jsFlashcards[2].id,
          userId: user1.id,
          quality: 0,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          nextReview: today.toISOString().split('T')[0],
          reviewedAt: yesterday,
        }),
      );
    }

    this.logger.log('Database seeded successfully!');
    this.logger.log(`Created ${2} users, ${3} decks, ${jsCards.length + dsaCards.length + tsCards.length} flashcards`);
    this.logger.log('Demo accounts:');
    this.logger.log('  test@test.com / password123');
    this.logger.log('  student@test.com / password123');
  }
}
