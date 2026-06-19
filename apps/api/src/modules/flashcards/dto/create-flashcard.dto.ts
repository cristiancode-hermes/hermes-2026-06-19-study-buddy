import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateFlashcardDto {
  @IsString()
  front: string;

  @IsString()
  back: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
