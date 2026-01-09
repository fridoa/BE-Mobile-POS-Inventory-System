import { Request, Response } from "express";
import uploader from "../utils/uploader";
import { error, success } from "../utils/response";

export default {
  async single(req: Request, res: Response) {
    if (!req.file) {
      return error(res, "No file uploaded", "File upload failed");
    }

    try {
      const result = await uploader.uploadSingle(req.file as Express.Multer.File);
      success(res, result, "File uploaded successfully");
    } catch (err) {
      error(res, err, "File upload failed");
    }
  },

  async multiple(req: Request, res: Response) {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return error(res, "No files uploaded", "Files upload failed");
    }

    try {
      const results = await uploader.uploadMultiple(req.files as Express.Multer.File[]);
      success(res, results, "Files uploaded successfully");
    } catch (err) {
      error(res, err, "Files upload failed");
    }
  },

  async remove(req: Request, res: Response) {
    const { fileId } = req.body as { fileId: string };

    if (!fileId) {
      return error(res, "File ID is required", "File removal failed");
    }
    try {
      const result = await uploader.removeFile(fileId);
      success(res, result, "File removed successfully");
    } catch (err) {
      error(res, err, "File removal failed");
    }
  },
};
