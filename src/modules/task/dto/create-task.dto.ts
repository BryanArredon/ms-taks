import { IsBoolean, IsNotEmpty, IsNumber, IsString, MaxLength, MinLength, Matches } from "class-validator";
import { IsSmartText } from "../../../common/decorators/is-smart-text.decorator.js";

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(150)
    @Matches(/^[a-zA-ZÀ-ÿ0-9][a-zA-ZÀ-ÿ0-9\s\-_.,!¡¿?()]*$/, { message: 'El título de la tarea debe empezar con una letra o número.' })
    @IsSmartText()
    name: string;  

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(500)
    @Matches(/.*\S.*/, { message: 'La descripción no puede estar vacía o solo con espacios.' })
    @IsSmartText()
    description: string;

    @IsBoolean()
    priority: boolean;
    @IsNumber()
    @IsNotEmpty()
    userId: number;
}
