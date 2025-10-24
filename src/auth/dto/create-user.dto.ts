import { IsString, IsNotEmpty, IsNumber, IsEmail, IsArray, IsOptional } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    role: string[];

}
