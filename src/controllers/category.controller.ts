import { Response } from "express";
import { IAuthRequest, IPaginationQuery } from "../utils/interfaces";
import CategoryModel from "../models/category.model";
import { error, pagination, success } from "../utils/response";

export default {
  async create(req: IAuthRequest, res: Response) {
    try {
      const result = await CategoryModel.create(req.body);
      success(res, result, "Category created successfully");
    } catch (err) {
      error(res, err, "Error creating category");
    }
  },

  async findAll(req: IAuthRequest, res: Response) {
    const { page = 1, limit = 10, search = "" } = req.query as unknown as IPaginationQuery;
    try {
      const query: any = { isActive: { $ne: false } };
      if (search) {
        Object.assign(query, {
          name: { $regex: search, $options: "i" },
        });
      }

      const [count, result] = await Promise.all([
        CategoryModel.countDocuments(query),
        CategoryModel.find(query)
          .limit(limit)
          .skip((page - 1) * limit)
          .sort({ createdAt: -1 })
          .exec(),
      ]);
      pagination(res, "Success fetch all categories ", { total: count, totalPages: Math.ceil(count / limit), currentPage: Number(page) }, result);
    } catch (err) {
      error(res, err, "Error fetch categories");
    }
  },

  async findOne(req: IAuthRequest, res: Response) {
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
    try {
      const { id } = req.params;
      const result = await CategoryModel.findByIdAndUpdate(id, req.body, {
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
    }
  },

  async remove(req: IAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await CategoryModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!result) {
        return error(res, null, "Category not found");
      }
      success(res, result, "Success Remove Category");
    } catch (err) {
      error(res, err, "Failed to remove category");
    }
  },
};
