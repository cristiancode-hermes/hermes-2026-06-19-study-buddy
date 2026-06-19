import { IsInt, Min, Max } from 'class-validator';

export class RateCardDto {
  @IsInt()
  flashcardId: number;

  @IsInt()
  @Min(0)
  @Max(5)
  quality: number;
}
