import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFlashcardDto } from './create-flashcard.dto';

export class BatchCreateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateFlashcardDto)
  cards: CreateFlashcardDto[];
}
