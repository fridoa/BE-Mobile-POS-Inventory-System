import { Response } from "express";
import { IAuthRequest, IPaginationQuery } from "../utils/interfaces";
import ProductModel from "../models/product.model";
import { error, pagination, success } from "../utils/response";
import uploader from "../utils/uploader";
import { sendNotification } from "../utils/fcm.util";
import UserModel from "../models/user.model";
import { ROLES } from "../utils/constants";

export default {
  async create(req: IAuthRequest, res: Response) {
    try {
      const result = await ProductModel.create(req.body);
      success(res, result, "Product created successfully");
    } catch (err) {
      error(res, err, "Error creating product");
    }
  },

  async findAll(req: IAuthRequest, res: Response) {
    const { page = 1, limit = 10, search = "", category = "", stockStatus = "", name = "", sku = "" } = req.query as unknown as IPaginationQuery;

    try {
      const query: any = {};

      const cleanSearch = search.trim();

      if (sku) {
        query.sku = sku;
      } else if (name) {
        query.name = { $regex: name, $options: "i" };
      }

      if (cleanSearch) {
        query.$or = [{ sku: cleanSearch }, { name: { $regex: cleanSearch, $options: "i" } }];
      }

      if (category) {
        query.category = category;
      }

      if (stockStatus === "low") {
        query.$expr = { $lte: ["$stock", "$minStock"] };
      }

      const [count, result] = await Promise.all([
        ProductModel.countDocuments(query),
        ProductModel.find(query)
          .populate("category", "name")
          .limit(limit)
          .skip((page - 1) * limit)
          .sort({ createdAt: -1 })
          .exec(),
      ]);

      pagination(
        res,
        "Success fetch all products",
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
        result
      );
    } catch (err) {
      error(res, err, "Error fetch products");
    }
  },

  async findOne(req: IAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await ProductModel.findById(id).populate("category", "name");

      if (!result) return error(res, null, "Produk tidak ditemukan");

      success(res, result, "Berhasil mengambil detail produk");
    } catch (err) {
      error(res, err, "Gagal mengambil detail produk");
    }
  },

  async update(req: IAuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const oldProduct = await ProductModel.findById(id);
      if (!oldProduct) return error(res, null, "Produk tidak ditemukan");

      const isImageReplaced = req.body.imageFileId && req.body.imageFileId !== oldProduct.imageFileId;
      const isImageRemoved = req.body.imageUrl === "" || req.body.imageUrl === null;

      if ((isImageReplaced || isImageRemoved) && oldProduct.imageFileId) {
        try {
          await uploader.removeFile(oldProduct.imageFileId);
          console.log(`[ImageKit]: Foto lama (${oldProduct.imageFileId}) berhasil dihapus.`);
        } catch (err) {
          console.error("[ImageKit Error]: Gagal menghapus foto lama, lanjut update database...");
        }
      }

      const result = await ProductModel.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      }).populate("category", "name");

      if (!result) return error(res, null, "Gagal memperbarui data produk");

      if (result.stock <= result.minStock) {
        const adminUser = await UserModel.findOne({ role: ROLES.ADMIN });

        if (adminUser?.fcmToken) {
          await sendNotification(adminUser.fcmToken, "⚠️ Stok Menipis!", `Produk ${result.name} tersisa ${result.stock} pcs. Segera restock!`);
        }
        console.log(`[FCM Trigger]: Stok ${result.name} menipis! Sisa: ${result.stock} (Min: ${result.minStock})`);
      }

      success(res, result, "Produk berhasil diperbarui");
    } catch (err) {
      if (err instanceof Error && (err as any).code === 11000) {
        return error(res, null, "SKU atau Nama produk sudah digunakan", 400);
      }

      error(res, err, "Gagal memperbarui produk");
    }
  },

  async remove(req: IAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await ProductModel.findByIdAndUpdate(id, { isActive: false }, { new: true });

      if (!result) return error(res, null, "Product not found");

      success(res, null, "Product successfully deactivated");
    } catch (err) {
      error(res, err, "Error deleting product");
    }
  },
};
