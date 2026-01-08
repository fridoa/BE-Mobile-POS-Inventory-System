import e, { Request, Response } from "express";
import authService from "../services/auth.service";
import { success, error } from "../utils/response";
import { IAuthRequest } from "../utils/interfaces";
import UserModel from "../models/user.model";

export default {
  async loginController(req: Request, res: Response) {
    try {
      const payload = await authService.loginService(req.body);
      success(res, payload, "Login successful");
    } catch (err) {
      error(res, err, "Login failed");
    }
  },

  async refreshTokenController(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return error(res, null, "Refresh token is required");
      }

      const payload = await authService.refreshTokenService(refreshToken);
      success(res, payload, "Token refreshed successfully");
    } catch (err) {
      error(res, err, "Failed to refresh token");
    }
  },

  async getProfileController(req: IAuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return error(res, null, "User not authenticated");
      }

      const userProfile = await UserModel.findById(userId).select("-password");
      if (!userProfile) {
        return error(res, null, "User not found");
      }

      success(res, userProfile, "User profile retrieved successfully");
    } catch (err) {
      error(res, err, "Failed to retrieve user profile");
    }
  },
};
