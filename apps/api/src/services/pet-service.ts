import { petRepository } from "../repositories/pet-repository.js";
import { storageService } from "./storage-service.js";
import { imageService } from "./image-service.js";
import { zipService } from "./zip-service.js";

export const petService = {
  async upload(data: {
    folderId: string;
    filename: string;
    mimeType: string;
    buffer: Buffer;
    uploadedById: string;
  }) {
    if (!data.mimeType.startsWith("image/")) {
      throw new InvalidPetMimeTypeError(
        `Formato ${data.mimeType} no permitido para PETs. Solo se aceptan imagenes.`,
      );
    }

    let { buffer, mimeType } = data;
    let { filename } = data;

    if (!imageService.isJpeg(mimeType)) {
      buffer = await imageService.convertToJpg(buffer);
      filename = imageService.replaceExtensionWithJpg(filename);
      mimeType = "image/jpeg";
    }

    const storageKey = `pets/${data.folderId}/${Date.now()}-${filename}`;

    await storageService.upload(storageKey, buffer, mimeType);

    const pet = await petRepository.create({
      folderId: data.folderId,
      filename,
      storageKey,
      mimeType,
      size: buffer.length,
      uploadedById: data.uploadedById,
    });

    return pet;
  },

  async listByFolder(folderId: string) {
    return petRepository.findByFolderId(folderId);
  },

  async download(id: string) {
    const pet = await petRepository.findById(id);
    if (!pet) return null;

    const stream = await storageService.download(pet.storageKey);
    return { pet, stream };
  },

  async remove(id: string) {
    const pet = await petRepository.findById(id);
    if (!pet) return null;

    await storageService.remove(pet.storageKey);
    await petRepository.deleteById(id);

    return pet;
  },

  async toggleColiseo(id: string, status: boolean) {
    return petRepository.updateColiseoStatus(id, status);
  },

  async bulkDownload(ids: string[]) {
    const items = await petRepository.findByIds(ids);
    if (items.length === 0) return null;

    const entries = items.map((pet) => ({
      filename: pet.filename,
      storageKey: pet.storageKey,
    }));

    return zipService.createZipStream(entries);
  },

  async bulkRemove(ids: string[]) {
    const items = await petRepository.findByIds(ids);
    if (items.length === 0) return [];

    await Promise.all(items.map((pet) => storageService.remove(pet.storageKey)));
    await petRepository.deleteByIds(ids);

    return items;
  },

  async reorder(items: { id: string; sortOrder: number }[]) {
    await petRepository.reorder(items);
  },
};

export class InvalidPetMimeTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPetMimeTypeError";
  }
}
