/**
 * Servicio de usuarios (solo Admin).
 *
 * Extraído del inline que vivía en `UsersPage.tsx` para dejarlo consistente con el
 * resto de servicios y poder testearlo. El backend expone `@Put(':id')` para el
 * update (ver H-15), por eso `update` usa PUT y no PATCH.
 */

import apiClient from './client';
import { User } from '../types';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: 'ADMIN' | 'STAFF';
  password?: string;
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },

  async create(user: CreateUserDto): Promise<User> {
    const { data } = await apiClient.post<User>('/users', user);
    return data;
  },

  async update(id: string, user: UpdateUserDto): Promise<User> {
    const { data } = await apiClient.put<User>(`/users/${id}`, user);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
