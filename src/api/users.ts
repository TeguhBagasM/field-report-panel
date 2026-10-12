import { api } from "./client";
import type { Role, User } from "../types";

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserBody {
  name?: string;
  role?: Role;
  isActive?: boolean;
  password?: string;
}

export async function listUsers(): Promise<User[]> {
  const res = await api.get<{ users: User[] }>("/users");
  return res.data.users;
}

export async function createUser(data: CreateUserBody): Promise<User> {
  const res = await api.post<{ user: User }>("/users", data);
  return res.data.user;
}

export async function updateUser(id: number, data: UpdateUserBody): Promise<User> {
  const res = await api.patch<{ user: User }>(`/users/${id}`, data);
  return res.data.user;
}
