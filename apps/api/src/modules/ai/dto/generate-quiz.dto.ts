import { IsString } from 'class-validator';

export class GenerateQuizDto {
  @IsString()
  text: string;
}
