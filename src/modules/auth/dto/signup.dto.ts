import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name!: string;

    @IsString()
    @MinLength(6)
    @MaxLength(72)
    password!: string;
}
