import { Injectable } from '@nestjs/common';
import { AIStrategy } from './ai-strategy.interface';

@Injectable()
export class LocalFallbackStrategy implements AIStrategy {
  async generateFlashcards(
    text: string,
  ): Promise<{ front: string; back: string }[]> {
    const cards: { front: string; back: string }[] = [];

    // Split by double newlines (paragraphs)
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    for (const paragraph of paragraphs) {
      // Split by sentences
      const sentences = paragraph
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20);

      if (sentences.length >= 2) {
        // Use first sentence as front, rest as back
        cards.push({
          front: sentences[0],
          back: sentences.slice(1).join('. '),
        });
      } else if (sentences.length === 1) {
        // Extract key terms using simple heuristics
        const words = sentences[0].split(/\s+/);
        const keyPhrases: string[] = [];
        let currentPhrase = '';

        for (const word of words) {
          if (/^[A-Z]/.test(word) && word.length > 3) {
            if (currentPhrase) {
              keyPhrases.push(currentPhrase.trim());
            }
            currentPhrase = word + ' ';
          } else {
            currentPhrase += word + ' ';
          }
        }
        if (currentPhrase.trim()) {
          keyPhrases.push(currentPhrase.trim());
        }

        if (keyPhrases.length >= 2) {
          cards.push({
            front: `What is "${keyPhrases[0]}"?`,
            back: keyPhrases.slice(1).join(', '),
          });
        } else {
          cards.push({
            front: `What is the main idea of this text?`,
            back: sentences[0],
          });
        }
      }
    }

    // If we still have no cards, create basic ones from line breaks
    if (cards.length === 0) {
      const lines = text.split('\n').filter((l) => l.trim().length > 20);
      for (let i = 0; i < Math.min(lines.length, 10); i += 2) {
        if (i + 1 < lines.length) {
          cards.push({ front: lines[i], back: lines[i + 1] });
        } else {
          cards.push({
            front: `What does this mean?`,
            back: lines[i],
          });
        }
      }
    }

    return cards.slice(0, 20);
  }

  async generateQuizQuestions(
    flashcards: { front: string; back: string }[],
    count: number,
  ): Promise<{ question: string; options: string[]; correctAnswer: string }[]> {
    const questions: {
      question: string;
      options: string[];
      correctAnswer: string;
    }[] = [];

    // Create MCQ by using one card's answer as correct and others as distractors
    for (let i = 0; i < Math.min(count, flashcards.length); i++) {
      const correctCard = flashcards[i];
      const distractors = flashcards
        .filter((_, idx) => idx !== i)
        .slice(0, 3)
        .map((c) => c.back);

      // If we don't have enough distractors, generate some
      while (distractors.length < 3) {
        distractors.push(`None of the above`);
      }

      // Shuffle options
      const options = [correctCard.back, ...distractors].sort(
        () => Math.random() - 0.5,
      );

      questions.push({
        question: correctCard.front,
        options,
        correctAnswer: correctCard.back,
      });
    }

    return questions;
  }
}
