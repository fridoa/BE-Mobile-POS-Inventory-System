import { Response } from "express";
import { IAuthRequest, IPaginationQuery } from "../utils/interfaces";
import CategoryModel from "../models/category.model";
import { error, pagination, success } from "../utils/response";

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
      const result = await CategoryModel.create(req.body);
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
    /*
        #swagger.summary = 'Remove Category'
        #swagger.tags = ['Category']
    */
    try {
      const { id } = req.params;
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
