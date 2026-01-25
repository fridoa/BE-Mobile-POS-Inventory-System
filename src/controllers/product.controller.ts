import { Response } from "express";
import { IAuthRequest, IPaginationQuery } from "../utils/interfaces";
import ProductModel from "../models/product.model";
import { error, pagination, success } from "../utils/response";
import uploader from "../utils/uploader";
import { ROLES } from "../utils/constants";
import { notificationService } from "../services/notification.service";

export default {
  async create(req: IAuthRequest, res: Response) {
    try {
      const { basePrice, costPrice, price, ...rest } = req.body;

      if (basePrice < costPrice) {
        return error(res, null, `Harga jual (${basePrice}) tidak boleh lebih rendah dari harga modal (${costPrice})`, 400);
      }

      const productData = {
        ...rest,
        basePrice,
        price: price !== undefined && price !== null ? price : basePrice,
      };

      if (basePrice === undefined || basePrice === null) {
        return error(res, null, "Harga Jual (basePrice) wajib diisi", 400);
      }

      const result = await ProductModel.create(productData);
      success(res, result, "Product created successfully");
    } catch (err) {
      error(res, err, "Error creating product");
    }
  },

  async findAll(req: IAuthRequest, res: Response) {
    const { page = 1, limit = 10, search = "", category = "", stockStatus = "", name = "", sku = "" } = req.query as unknown as IPaginationQuery;

    try {
      const query: any = { isActive: { $ne: false } };

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
          currentPage: Number(page),
        },
        result,
      );
    } catch (err) {
      error(res, err, "Error fetch products");
    }
  },

  async findOne(req: IAuthRequest, res: Response) {
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
    try {
      let { sku } = req.params;
      sku = String(sku).trim();
      const result = await ProductModel.findOne({ sku }).populate("category", "name");

      if (!result) return error(res, null, "Produk tidak ditemukan", 404);
      success(res, result, "Berhasil mengambil data produk berdasarkan SKU");
    } catch (err) {
      error(res, err, "Gagal mengambil data produk berdasarkan SKU");
    }
  },

  async update(req: IAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { basePrice, costPrice, price, ...rest } = req.body;

      const oldProduct = await ProductModel.findById(id);
      if (!oldProduct) return error(res, null, "Produk tidak ditemukan");

      const finalBasePrice = basePrice !== undefined ? basePrice : oldProduct.basePrice;
      const finalCostPrice = costPrice !== undefined ? costPrice : oldProduct.costPrice;

      if (finalBasePrice < finalCostPrice) {
        return error(res, null, `Update ditolak: Harga jual baru (${finalBasePrice}) lebih rendah dari harga modal (${finalCostPrice})`, 400);
      }

      let updatedData: any = { ...rest, basePrice, costPrice };

      if (basePrice !== undefined) {
        updatedData.price = price !== undefined ? price : basePrice;
      } else if (price !== undefined) {
        updatedData.price = price;
      }

      const result = await ProductModel.findByIdAndUpdate(id, updatedData, {
        new: true,
        runValidators: true,
      }).populate("category", "name");

      success(res, result, "Produk berhasil diperbarui");
    } catch (err) {
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
