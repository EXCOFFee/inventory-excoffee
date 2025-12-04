/**
 * Servicio de Usuarios de InventoryPro.
 * 
 * Responsabilidad única: Gestionar operaciones CRUD de usuarios.
 * 
 * @class UsersService
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todos los usuarios del sistema.
   * 
   * @returns Lista de usuarios (sin password hash)
   */
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene un usuario por su ID.
   * 
   * @param id - ID del usuario
   * @returns Usuario encontrado
   * @throws NotFoundException si no existe
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { movements: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  /**
   * Crea un nuevo usuario.
   * 
   * @param createUserDto - Datos del usuario
   * @returns Usuario creado
   * @throws ConflictException si el email ya existe
   */
  async create(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName, role } = createUserDto;

    // Verificar email único
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    return this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  /**
   * Actualiza un usuario existente.
   * 
   * @param id - ID del usuario
   * @param updateUserDto - Datos a actualizar
   * @returns Usuario actualizado
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verificar que existe
    await this.findOne(id);

    // Si se actualiza el email, verificar que no exista
    if (updateUserDto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email.toLowerCase(),
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    // Si se actualiza la contraseña, hashearla
    let passwordHash: string | undefined;
    if (updateUserDto.password) {
      passwordHash = await bcrypt.hash(updateUserDto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.email && { email: updateUserDto.email.toLowerCase() }),
        ...(updateUserDto.firstName && { firstName: updateUserDto.firstName }),
        ...(updateUserDto.lastName && { lastName: updateUserDto.lastName }),
        ...(updateUserDto.role && { role: updateUserDto.role }),
        ...(updateUserDto.isActive !== undefined && { isActive: updateUserDto.isActive }),
        ...(passwordHash && { passwordHash }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Desactiva un usuario (soft delete).
   * 
   * @param id - ID del usuario
   * @returns Usuario desactivado
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });
  }
}
