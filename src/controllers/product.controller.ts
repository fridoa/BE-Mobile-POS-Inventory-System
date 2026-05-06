import { Response } from "express";
import { IAuthRequest, IPaginationQuery } from "../utils/interfaces";
import ProductModel, { IProduct } from "../models/product.model";
import UserModel from "../models/user.model";
import { error, pagination, success } from "../utils/response";
import uploader from "../utils/uploader";
import { ROLES } from "../utils/constants";
import { sendMulticastNotification } from "../utils/fcm.util";
import NotificationModel from "../models/notification.model";
import { notificationService } from "../services/notification.service";

const ProductController = {
  async create(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Create Product'
        #swagger.tags = ['Product']
        #swagger.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateProduct" }
            }
          }
        }
    */
    try {
      const { basePrice, costPrice, discount, ...rest } = req.body;

      if (basePrice < costPrice) {
        return error(res, null, `Harga jual (${basePrice}) tidak boleh lebih rendah dari harga modal (${costPrice})`, 400);
      }

      const discountAmount = (basePrice * (discount || 0)) / 100;
      const finalPrice = basePrice - discountAmount;

      const productData = {
        ...rest,
        basePrice,
        costPrice,
        discount: discount || 0,
        price: finalPrice,
      };

      const result = await ProductModel.create(productData);
      success(res, result, "Produk berhasil ditambahkan");
    } catch (err) {
      error(res, err, "Gagal membuat produk");
    }
  },

  async findAll(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Find All Products'
        #swagger.tags = ['Product']
    */
    const { page = 1, limit = 10, search = "", category = "", stockStatus = "", name = "", sku = "" } = req.query as unknown as IPaginationQuery;

    try {
      const query: any = { deletedAt: null };
      const cleanSearch = search.trim();

      if (sku) query.sku = sku;
      else if (name) query.name = { $regex: name, $options: "i" };

      if (cleanSearch) {
        query.$or = [{ sku: cleanSearch }, { name: { $regex: cleanSearch, $options: "i" } }];
      }

      if (category) query.category = category;

      if (stockStatus === "low") {
        query.$expr = { $lte: ["$stock", "$minStock"] };
      }

      const [count, result] = await Promise.all([
        ProductModel.countDocuments(query),
        ProductModel.find(query)
          .populate("category", "name")
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit))
          .sort({ createdAt: -1 })
          .exec(),
      ]);

      pagination(
        res,
        "Berhasil mengambil semua produk",
        {
          total: count,
          totalPages: Math.ceil(count / Number(limit)),
          currentPage: Number(page),
        },
        result,
      );
    } catch (err) {
      error(res, err, "Gagal mengambil data produk");
    }
  },

  async findOne(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Find One Product'
        #swagger.tags = ['Product']
    */
    try {
      const { id } = req.params;
      const result = await ProductModel.findById(id).populate("category", "name");

      if (!result) return error(res, null, "Produk tidak ditemukan", 404);

      success(res, result, "Berhasil mengambil detail produk");
    } catch (err) {
      error(res, err, "Gagal mengambil detail produk");
    }
  },

  async findBySKU(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Find One Product by SKU'
        #swagger.tags = ['Product']
    */
    try {
      let { sku } = req.params;

      const cleanSKU = String(sku).trim();

      const result = await ProductModel.findOne({
        sku: cleanSKU,
        deletedAt: null,
      }).populate("category", "name");

      if (!result) {
        return error(res, null, `Produk dengan SKU "${cleanSKU}" tidak ditemukan`, 404);
      }

      success(res, result, "Berhasil mengambil data produk berdasarkan SKU");
    } catch (err) {
      error(res, err, "Gagal mengambil data produk berdasarkan SKU");
    }
  },

  async update(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Update Product'
        #swagger.tags = ['Product']
        #swagger.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProduct" }
            }
          }
        }
    */
    try {
      const { id } = req.params;
      const { basePrice, costPrice, discount, stock, name, sku, ...rest } = req.body;

      const oldProduct = await ProductModel.findById(id);
      if (!oldProduct) return error(res, null, "Produk tidak ditemukan", 404);

      if (name && name !== oldProduct.name) {
        const nameConflict = await ProductModel.findOne({ name, _id: { $ne: id } });
        if (nameConflict) return error(res, null, "Nama produk sudah digunakan", 400);
      }

      const trimmedSku = sku?.trim();
      if (trimmedSku && trimmedSku !== oldProduct.sku) {
        const skuConflict = await ProductModel.findOne({ sku: trimmedSku, _id: { $ne: id } });
        if (skuConflict) return error(res, null, "SKU sudah digunakan oleh produk lain", 400);
      }

      const finalBasePrice = basePrice ?? oldProduct.basePrice;
      const finalCostPrice = costPrice ?? oldProduct.costPrice;
      const finalDiscount = discount ?? oldProduct.discount;

      if (finalBasePrice < finalCostPrice) {
        return error(res, null, `Harga jual (${finalBasePrice}) tidak boleh di bawah modal (${finalCostPrice})`, 400);
      }

      const discountAmount = (finalBasePrice * (finalDiscount || 0)) / 100;
      const calculatedPrice = finalBasePrice - discountAmount;

      const isImageReplaced = req.body.imageFileId && req.body.imageFileId !== oldProduct.imageFileId;
      const isImageRemoved = req.body.imageUrl === "" || req.body.imageUrl === null;

      if ((isImageReplaced || isImageRemoved) && oldProduct.imageFileId) {
        await uploader.removeFile(oldProduct.imageFileId).catch((e) => console.error("[ImageKit]: Gagal hapus file lama:", e.message));
      }

      const result = await ProductModel.findByIdAndUpdate(
        id,
        {
          ...rest,
          name,
          sku: trimmedSku || oldProduct.sku,
          basePrice: finalBasePrice,
          costPrice: finalCostPrice,
          discount: finalDiscount,
          stock: stock ?? oldProduct.stock,
          price: calculatedPrice,
        },
        { new: true, runValidators: true },
      ).populate("category", "name");

      if (!result) return error(res, null, "Gagal memperbarui data");

      if (result.stock <= result.minStock) {
        await ProductController.handleLowStockNotification(result);
      }

      success(res, result, "Produk berhasil diperbarui");
    } catch (err) {
      if (err instanceof Error && (err as any).code === 11000) {
        return error(res, null, "Data (SKU atau Nama) sudah digunakan", 400);
      }
      error(res, err, "Gagal memperbarui produk");
    }
  },

  async handleLowStockNotification(product: IProduct) {
    try {
      await notificationService.send({
        title: "⚠️ Stok Menipis!",
        message: `Produk ${product.name} tersisa ${product.stock} pcs. Segera restock!`,
        type: "WARNING",
        targetRole: "admin",
        data: {
          productId: product._id.toString(),
        },
      });
    } catch (err) {
      console.error("[Notification Error]:", err);
    }
  },

  async remove(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Remove Product'
        #swagger.tags = ['Product']
    */
    try {
      const { id } = req.params;
      const result = await ProductModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });

      if (!result) return error(res, null, "Produk tidak ditemukan", 404);

      success(res, null, "Produk berhasil dinonaktifkan");
    } catch (err) {
      error(res, err, "Gagal menghapus produk");
    }
  },
};

export default ProductController;
