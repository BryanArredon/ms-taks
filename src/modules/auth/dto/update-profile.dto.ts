import { IsNotEmpty, IsString, MaxLength, MinLength, Matches, IsOptional } from "class-validator";
import { IsSmartText } from "../../../common/decorators/is-smart-text.decorator.js";

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(150)
    @Matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s[a-zA-ZÀ-ÿ\u00f1\u00d1]+)*$/, { message: 'El nombre debe empezar con letras y no tener espacios al final.' })
    @Matches(/.*\S.*/, { message: 'El nombre no puede estar compuesto solo por espacios.' })
    @IsSmartText()
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(250)
    @Matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s[a-zA-ZÀ-ÿ\u00f1\u00d1]+)*$/, { message: 'El apellido debe empezar con letras y no tener espacios al final.' })
    @Matches(/.*\S.*/, { message: 'El apellido no puede estar compuesto solo por espacios.' })
    @IsSmartText()
    lastname?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    @Matches(/^[a-zA-Z0-9_-]{3,100}$/, { message: 'El usuario solo puede tener letras, números, guiones y guiones bajos.' })
    @IsSmartText()
    username?: string;
}
