import { Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { BadRequestAppException } from '../exceptions/app.exception';

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value, '4')) {
      throw new BadRequestAppException(
        'The provided identifier is not a valid UUID',
      );
    }
    return value;
  }
}
