import type { CreateUserInput, UpdateUserInput } from "@minidrive/shared";
import { userRepository } from "../repositories/user-repository.js";
import { auth } from "../lib/auth.js";

export const userService = {
  async list(includeDeleted = false) {
    const users = await userRepository.findAll(includeDeleted);
    return users.map(sanitizeUser);
  },

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) return null;
    return sanitizeUser(user);
  },

  async create(input: CreateUserInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Ya existe un usuario con ese email");
    }

    const result = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: input.name,
      },
    });

    if (!result?.user) {
      throw new Error("Error al crear usuario");
    }

    if (input.role && input.role !== "user") {
      await userRepository.updateById(result.user.id, { role: input.role });
    }

    const user = await userRepository.findById(result.user.id);
    return sanitizeUser(user!);
  },

  async update(id: string, input: UpdateUserInput) {
    const user = await userRepository.findById(id);
    if (!user) return null;

    if (input.email && input.email !== user.email) {
      const existing = await userRepository.findByEmail(input.email);
      if (existing) {
        throw new ConflictError("Ya existe un usuario con ese email");
      }
    }

    const updated = await userRepository.updateById(id, input);
    return updated ? sanitizeUser(updated) : null;
  },

  async softDelete(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new SelfDeleteError("No puedes eliminarte a ti mismo");
    }

    const user = await userRepository.findById(id);
    if (!user) return null;

    const deleted = await userRepository.softDelete(id);
    return deleted ? sanitizeUser(deleted) : null;
  },
};

function sanitizeUser(user: Record<string, unknown>) {
  const { deletedAt, ...rest } = user as Record<string, unknown>;
  return { ...rest, deletedAt };
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class SelfDeleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SelfDeleteError";
  }
}
