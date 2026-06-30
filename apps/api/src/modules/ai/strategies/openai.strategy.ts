import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIStrategy } from './ai-strategy.interface';

@Injectable()
export class OpenAIStrategy implements AIStrategy {
  private readonly logger = new Logger(OpenAIStrategy.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
  }

  async generateFlashcards(
    text: string,
  ): Promise<{ front: string; back: string }[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Extract question-answer pairs from the following text. Create flashcards where the "front" is a question and the "back" is the answer. Return a JSON array of objects with "front" and "back" properties. Generate at least 5 cards if possible.

Text:
${text}

Return ONLY valid JSON array, no markdown formatting.`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = response.data.choices[0].message.content;
      const cards = JSON.parse(content);
      return Array.isArray(cards) ? cards : [];
    } catch (error: any) {
      this.logger.error('OpenAI API error', error.message);
      throw new Error(`Failed to generate flashcards: ${error.message}`);
    }
  }

  async generateQuizQuestions(
    flashcards: { front: string; back: string }[],
    count: number,
  ): Promise<{ question: string; options: string[]; correctAnswer: string }[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const cardsText = flashcards
      .map((c, i) => `Card ${i + 1}: Q: ${c.front} | A: ${c.back}`)
      .join('\n');

    const prompt = `Based on the following flashcards, create ${count} multiple-choice quiz questions. Each question should have 4 options with one correct answer.

Flashcards:
${cardsText}

Return a JSON array of objects with "question" (string), "options" (array of 4 strings), and "correctAnswer" (string) properties.

Return ONLY valid JSON array, no markdown formatting.`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 3000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = response.data.choices[0].message.content;
      const questions = JSON.parse(content);
      return Array.isArray(questions) ? questions.slice(0, count) : [];
    } catch (error: any) {
      this.logger.error('OpenAI API error', error.message);
      throw new Error(`Failed to generate quiz questions: ${error.message}`);
    }
  }
}
