import { Response } from "express";
import { IAuthRequest, IPaginationQuery } from "../utils/interfaces";
import UserModel from "../models/user.model";
import { error, pagination, success } from "../utils/response";

export default {
  async create(req: IAuthRequest, res: Response) {
    try {
      const result = await UserModel.create(req.body);
      success(res, result, "User created successfully");
    } catch (err) {
      error(res, err, "Error creating user");
    }
  },

  async findAll(req: IAuthRequest, res: Response) {
    const { page = 1, limit = 10, search = "" } = req.query as unknown as IPaginationQuery;
    try {
      const query: any = { isActive: { $ne: false } };
      if (search) {
        Object.assign(query, {
          $or: [
            {
              username: { $regex: search, $options: "i" },
            },
            {
              name: { $regex: search, $options: "i" },
            },
          ],
        });
      }

      const [count, result] = await Promise.all([
        UserModel.countDocuments(query),
        UserModel.find(query)
          .select("-password -refreshToken")
          .limit(limit)
          .skip((page - 1) * limit)
          .sort({ createdAt: -1 })
          .exec(),
      ]);

      pagination(res, "Berhasil mengambil semua data user", { total: count, totalPages: Math.ceil(count / limit), currentPage: page }, result);
    } catch (err) {
      error(res, err, "Gagal mengambil data user");
    }
  },

  async findOne(req: IAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserModel.findById(id);
      if (!result) {
        return error(res, null, "User not found");
      }
      success(res, result, "Berhasil mengambil data user by id");
    } catch (err) {
      error(res, err, "Gagal mengambil data user by id");
    }
  },

  async update(req: IAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserModel.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      }).select("-password -refreshToken");
      if (!result) {
        return error(res, null, "User not found");
      }
      success(res, result, "Berhasil memperbarui user");
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === 11000) {
        return error(res, { message: "Username sudah digunakan." }, "Gagal memperbarui user");
      }
    }
  },

  async remove(req: IAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!result) {
        return error(res, null, "User not found");
      }
      success(res, result, "Berhasil menghapus user");
    } catch (err) {
      error(res, err, "Gagal menghapus user");
    }
  },
};
