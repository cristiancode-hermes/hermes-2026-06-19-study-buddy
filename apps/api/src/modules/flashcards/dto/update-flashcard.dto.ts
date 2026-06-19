import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class UpdateFlashcardDto {
  @IsOptional()
  @IsString()
  front?: string;

  @IsOptional()
  @IsString()
  back?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
