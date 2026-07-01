import { Response } from "express";
import { IAuthRequest, IPaginationQuery } from "../utils/interfaces";
import CategoryModel from "../models/category.model";
import ProductModel from "../models/product.model";
import { error, pagination, success } from "../utils/response";
import uploader from "../utils/uploader";

export default {
  async create(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Create Category'
        #swagger.tags = ['Category']
        #swagger.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCategory" }
            }
          }
        }
    */
    try {
      const { name, imageUrl, imageFileId } = req.body;
      const result = await CategoryModel.create({
        name,
        imageUrl: imageUrl || null,
        imageFileId: imageFileId || null,
      });
      success(res, result, "Category created successfully");
    } catch (err) {
      error(res, err, "Error creating category");
    }
  },

  async findAll(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Find All Categories'
        #swagger.tags = ['Category']
    */
    const { page = 1, limit = 10, search = "" } = req.query as unknown as IPaginationQuery;
    try {
      const query: any = { deletedAt: null };
      if (search) {
        Object.assign(query, {
          name: { $regex: search, $options: "i" },
        });
      }

      const [count, result] = await Promise.all([
        CategoryModel.countDocuments(query),
        CategoryModel.aggregate([
          { $match: query },
          {
            $lookup: {
              from: "products",
              let: { categoryId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$category", "$$categoryId"] },
                        { $eq: [{ $ifNull: ["$deletedAt", null] }, null] },
                      ],
                    },
                  },
                },
              ],
              as: "productsData",
            },
          },
          {
            $addFields: {
              productCount: { $size: "$productsData" },
              id: "$_id",
            },
          },
          { $project: { productsData: 0 } },
          { $sort: { createdAt: -1 } },
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) },
        ]).exec(),
      ]);
      pagination(res, "Success fetch all categories ", { total: count, totalPages: Math.ceil(count / limit), currentPage: Number(page) }, result);
    } catch (err) {
      error(res, err, "Error fetch categories");
    }
  },

  async findOne(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Find One Category'
        #swagger.tags = ['Category']
    */
    try {
      const { id } = req.params;
      const result = await CategoryModel.findById(id);
      if (!result) {
        return error(res, null, "Category not found");
      }
      success(res, result, "Success fetch category by id");
    } catch (err) {
      error(res, err, "Error fetch category by id");
    }
  },

  async update(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Update Category'
        #swagger.tags = ['Category']
        #swagger.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCategory" }
            }
          }
        }
    */
    try {
      const { id } = req.params;
      const { name, imageUrl, imageFileId } = req.body;

      const oldCategory = await CategoryModel.findById(id);
      if (!oldCategory) return error(res, null, "Category not found");

      // Hapus gambar lama dari ImageKit jika gambar diganti atau dihapus
      const isImageReplaced = imageFileId && imageFileId !== oldCategory.imageFileId;
      const isImageRemoved = imageUrl === "" || imageUrl === null;
      if ((isImageReplaced || isImageRemoved) && oldCategory.imageFileId) {
        await uploader.removeFile(oldCategory.imageFileId).catch((e: Error) =>
          console.error("[ImageKit] Gagal hapus gambar lama kategori:", e.message)
        );
      }

      const updatePayload: any = { name };
      if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl || null;
      if (imageFileId !== undefined) updatePayload.imageFileId = imageFileId || null;

      const result = await CategoryModel.findByIdAndUpdate(id, updatePayload, {
        new: true,
        runValidators: true,
      });

      if (!result) {
        return error(res, null, "Category not found");
      }

      success(res, result, "Update Category Successfull");
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === 11000) {
        return error(res, { message: "Category name already exists." }, "Failed to update category");
      }
      error(res, err, "Failed to update category");
    }
  },

  async remove(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Remove Category'
        #swagger.tags = ['Category']
    */
    try {
      const { id } = req.params;

      // Cek apakah masih ada produk aktif di kategori ini
      const activeProductCount = await ProductModel.countDocuments({ category: id, deletedAt: null });
      if (activeProductCount > 0) {
        return error(res, null, `Kategori tidak bisa dihapus karena masih memiliki ${activeProductCount} produk aktif`, 400);
      }

      // Hapus gambar dari ImageKit sebelum soft delete
      const category = await CategoryModel.findById(id);
      if (category?.imageFileId) {
        await uploader.removeFile(category.imageFileId).catch((e: Error) =>
          console.error("[ImageKit] Gagal hapus gambar kategori:", e.message)
        );
      }

      const result = await CategoryModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
      if (!result) {
        return error(res, null, "Category not found");
      }
      success(res, result, "Success Remove Category");
    } catch (err) {
      error(res, err, "Failed to remove category");
    }
  },
};
