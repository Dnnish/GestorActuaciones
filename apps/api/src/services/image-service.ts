import sharp from "sharp";

export const imageService = {
  async convertToJpg(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer).jpeg({ quality: 90 }).toBuffer();
  },

  isJpeg(mimeType: string): boolean {
    return mimeType === "image/jpeg";
  },

  replaceExtensionWithJpg(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1) return `${filename}.jpg`;
    return `${filename.slice(0, lastDot)}.jpg`;
  },
};
