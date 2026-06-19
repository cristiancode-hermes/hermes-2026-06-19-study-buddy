import { IsArray, IsBoolean, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuizAnswerDto {
  @IsInt()
  flashcardId: number;

  @IsBoolean()
  correct: boolean;
}

export class SubmitQuizDto {
  @IsInt()
  deckId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  results: QuizAnswerDto[];
}
