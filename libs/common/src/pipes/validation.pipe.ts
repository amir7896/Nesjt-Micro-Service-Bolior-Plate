import {
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ValidationAppException } from '../exceptions/app.exception';

function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): Record<string, string[]> {
  return errors.reduce<Record<string, string[]>>((acc, error) => {
    const path = parent ? `${parent}.${error.property}` : error.property;

    if (error.constraints) {
      acc[path] = Object.values(error.constraints);
    }

    if (error.children?.length) {
      Object.assign(acc, flattenValidationErrors(error.children, path));
    }

    return acc;
  }, {});
}

export const validationPipeOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  stopAtFirstError: false,
  exceptionFactory: (errors: ValidationError[]) =>
    new ValidationAppException(flattenValidationErrors(errors)),
};

export const createValidationPipe = () =>
  new ValidationPipe(validationPipeOptions);
