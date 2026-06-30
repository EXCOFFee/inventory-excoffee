/**
 * Tests de validación del CreateMovementDto (P2-DTO / H-11).
 *
 * Verifica que `quantity` deba ser un entero positivo. El ValidationPipe global convierte estas
 * violaciones en un 400.
 *
 * @file create-movement.dto.spec.ts
 */

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MovementType } from '@prisma/client';
import { CreateMovementDto } from './create-movement.dto';

const BASE = {
  productId: '550e8400-e29b-41d4-a716-446655440000',
  type: MovementType.IN,
  quantity: 3,
};

async function quantityError(quantity: unknown) {
  const dto = plainToInstance(CreateMovementDto, { ...BASE, quantity });
  const errors = await validate(dto);
  return errors.find((e) => e.property === 'quantity');
}

describe('CreateMovementDto', () => {
  it('acepta una cantidad entera (3)', async () => {
    expect(await quantityError(3)).toBeUndefined();
  });

  it('rechaza una cantidad decimal (2.5) → 400', async () => {
    const error = await quantityError(2.5);
    expect(error).toBeDefined();
    expect(error?.constraints).toHaveProperty('isInt');
  });

  it('rechaza una cantidad menor a 1', async () => {
    expect(await quantityError(0)).toBeDefined();
  });
});
