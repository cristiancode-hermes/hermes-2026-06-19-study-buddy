import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateDeckDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
