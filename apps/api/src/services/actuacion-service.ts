import { actuacionRepository } from "../repositories/actuacion-repository.js";

export const actuacionService = {
  async list(
    page: number,
    limit: number,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    coliseoStatus?: string,
  ) {
    return actuacionRepository.findAll(page, limit, search, sortBy, sortOrder, coliseoStatus);
  },

  async getById(id: string) {
    const actuacion = await actuacionRepository.findById(id);
    if (!actuacion) return null;

    const folderCounts = await actuacionRepository.getDocumentCountsByFolder(id);
    return { ...actuacion, folderCounts };
  },

  async create(name: string, createdById: string) {
    return actuacionRepository.create({ name, createdById });
  },

  async rename(id: string, name: string, requesterId: string, requesterRole: string) {
    const actuacion = await actuacionRepository.findById(id);
    if (!actuacion) return null;

    // user role can only rename their own actuaciones
    if (requesterRole === "user" && actuacion.createdById !== requesterId) {
      throw new ForbiddenError("No tienes permisos para renombrar esta actuación");
    }

    return actuacionRepository.updateName(id, name);
  },

  async updateFolderColiseoStatus(id: string, folder: string, status: boolean, requesterRole: string) {
    if (!["superadmin", "admin"].includes(requesterRole)) {
      throw new ForbiddenError("No tienes permisos para cambiar el estado coliseo");
    }
    return actuacionRepository.updateFolderColiseoStatus(id, folder, status);
  },

  async updateColiseoStatus(id: string, status: boolean, requesterRole: string) {
    if (!["superadmin", "admin"].includes(requesterRole)) {
      throw new ForbiddenError("No tienes permisos para cambiar el estado coliseo");
    }

    const actuacion = await actuacionRepository.findById(id);
    if (!actuacion) return null;

    return actuacionRepository.updateColiseoStatus(id, status);
  },

  async delete(id: string, requesterId: string, requesterRole: string) {
    const actuacion = await actuacionRepository.findById(id);
    if (!actuacion) return null;

    if (requesterRole === "superadmin") {
      await actuacionRepository.deleteById(id);
      return actuacion;
    }

    if (requesterRole === "admin") {
      if (actuacion.createdById !== requesterId) {
        throw new ForbiddenError("No tienes permisos para eliminar esta actuacion");
      }
      await actuacionRepository.deleteById(id);
      return actuacion;
    }

    throw new ForbiddenError("No tienes permisos para eliminar actuaciones");
  },
};

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}
