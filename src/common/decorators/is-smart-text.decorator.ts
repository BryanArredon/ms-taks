import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isSmartText', async: false })
export class IsSmartTextConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    if (!value) return true;

    // 1. Detección de caracteres repetidos (máx 3 seguidos)
    if (/(.)\1{3,}/.test(value)) return false;

    // 2. Detección de palabras sin vocales o con densidad muy baja (> 4 letras)
    const words = value.split(/\s+/);
    for (const word of words) {
      const wordLen = word.length;
      if (wordLen > 4) {
        const vowelMatches = word.match(/[aeiouáéíóúüAEIOUÁÉÍÓÚÜ]/ig);
        const vowelCount = vowelMatches ? vowelMatches.length : 0;
        const hasNumbers = /[0-9]/.test(word);

        if (vowelCount === 0 && !hasNumbers) return false;

        // Regla B: Densidad de vocales demasiado baja en palabras largas
        if (wordLen > 6 && (vowelCount / wordLen) < 0.25 && !hasNumbers) {
            return false;
        }
      }

      // Regla C: Ratio de variedad de caracteres
      if (word.length > 8) {
        const uniqueChars = new Set(word.toLowerCase()).size;
        if ((uniqueChars / word.length) < 0.45) return false;
      }
    }

    // 3. Detección de clusters de consonantes exagerados (> 4 seguidos)
    if (/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}/.test(value)) return false;

    // 4. Texto demasiado largo sin espacios (> 25 caracteres)
    if (value.length > 25 && !/\s+/.test(value)) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'El campo $property parece ser aleatorio o carece de sentido coherente.';
  }
}

export function IsSmartText(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSmartTextConstraint,
    });
  };
}
