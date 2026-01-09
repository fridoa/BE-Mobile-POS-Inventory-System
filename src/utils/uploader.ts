import ImageKit from "imagekit";
import { env } from "./env";

const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

const imageKitUtil = {
  async uploadSingle(file: Express.Multer.File, folder = "products") {
    try {
      const fileName = `${Date.now()}-${file.originalname}`;

      const result = await imagekit.upload({
        file: file.buffer,
        fileName: fileName,
        folder: folder,
      });
      return { url: result.url, fileId: result.fileId };
    } catch (error) {
      throw error;
    }
  },

  async uploadMultiple(files: Express.Multer.File[]) {
    const uploadPromises = files.map((item) => {
      return imageKitUtil.uploadSingle(item);
    });
    const results = await Promise.all(uploadPromises);
    return results;
  },

  async removeFile(fileId: string) {
    try {
      const result = await imagekit.deleteFile(fileId);
      return result;
    } catch (error) {
      throw error;
    }
  },
};

export default imageKitUtil;
