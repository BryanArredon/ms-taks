import { IsAlpha, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, Matches } from "class-validator";
import { IsSmartText } from "../../../common/decorators/is-smart-text.decorator.js";

export class UpdateTaskDto {
    
        @IsOptional()
        @IsString({message: 'Debe ser una cadena'})
        @MinLength(3,{message: 'Debe tener al menos 3 caracteres'}) 
        @MaxLength(150)
        @Matches(/^[a-zA-ZÀ-ÿ0-9][a-zA-ZÀ-ÿ0-9\s\-_.,!¡¿?()]*$/, { message: 'El título de la tarea debe empezar con una letra o número.' })
        @IsSmartText()
        name: string;

        @IsOptional()
        @IsString({message: 'Debe ser una cadena'})
        @MinLength(3,{message: 'Debe tener al menos 3 caracteres'})
        @MaxLength(500)
        @Matches(/.*\S.*/, { message: 'La descripción no puede estar vacía o solo con espacios.' })
        @IsSmartText()
        description: string;

        @IsOptional()   
        @IsBoolean()
        priority: boolean;

}