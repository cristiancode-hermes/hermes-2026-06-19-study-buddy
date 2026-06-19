import { IsString } from 'class-validator';

export class GenerateFlashcardsDto {
  @IsString()
  text: string;
}
