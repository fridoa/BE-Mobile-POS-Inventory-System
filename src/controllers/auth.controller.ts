import { Request, Response } from "express";
import authService from "../services/auth.service";
import { success, error, unauthorized } from "../utils/response";
import { IAuthRequest } from "../utils/interfaces";
import UserModel from "../models/user.model";
import { TChangePassword } from "../validators/auth.validate";

const FORGOT_PASSWORD_SECURITY_MESSAGE =
  "Jika email yang Anda masukkan terdaftar sebagai Admin, instruksi pemulihan kata sandi telah dikirim ke kotak masuk Anda. Jika Anda adalah Kasir, silakan hubungi Admin toko untuk melakukan reset kata sandi";

export default {
  async loginController(req: Request, res: Response) {
    /*
        #swagger.summary = 'User Login'
        #swagger.tags = ['Auth']
        #swagger.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Login" }
            }
          }
        }
      */
    try {
      const { fcmToken } = req.body;

      const payload = await authService.loginService(req.body, fcmToken);
      success(res, payload, "Login successful");
    } catch (err) {
      error(res, err, "Login failed");
    }
  },

  async logoutController(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'User Logout'
        #swagger.tags = ['Auth']
    */
    try {
      const userId = req.user?._id;
      if (!userId) {
        return unauthorized(res, "User not authenticated / Session invalid");
      }
      await authService.logoutService(userId);
      success(res, null, "Logout successful");
    } catch (err) {
      error(res, err, "Logout failed");
    }
  },

  async updateProfileController(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Update Profile'
        #swagger.tags = ['Auth']
        #swagger.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfile" }
            }
          }
        }
      */
    try {
      const userId = req.user?._id;
      if (!userId) return unauthorized(res, "Sesi tidak valid");

      const updatedUser = await authService.updateProfileService(userId, req.body);

      const payload = updatedUser.toObject();
      const { password, ...userWithoutPassword } = payload;

      success(res, userWithoutPassword, "Profil berhasil diperbarui");
    } catch (err) {
      error(res, err, "Gagal memperbarui profil");
    }
  },

  async refreshTokenController(req: Request, res: Response) {
    /*
        #swagger.summary = 'Refresh Token'
        #swagger.tags = ['Auth']
        #swagger.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshToken" }
            }
          }
        }
    */
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
    /*
        #swagger.summary = 'Get Profile'
        #swagger.tags = ['Auth']
    */
    try {
      const userId = req.user?._id;
      if (!userId) {
        return error(res, null, "User not authenticated");
      }

      const userProfile = await UserModel.findById(userId).select("-password -fcmToken -__v");
      if (!userProfile) {
        return error(res, null, "User not found");
      }

      success(res, userProfile, "User profile retrieved successfully");
    } catch (err) {
      error(res, err, "Failed to retrieve user profile");
    }
  },

  async changePasswordController(req: IAuthRequest, res: Response) {
    /*
        #swagger.summary = 'Change Password'
        #swagger.tags = ['Auth']
        #swagger.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePassword" }
            }
          }
        }
    */
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: "Gagal mengidentifikasi pengguna dari token" });
      }

      const passwordData: TChangePassword = req.body;
      await authService.changePasswordService(userId, passwordData);
      success(res, null, "Password berhasil diubah");
    } catch (err) {
      error(res, err, "Gagal mengubah password");
    }
  },

  async forgotPasswordController(req: Request, res: Response) {
    /*
        #swagger.summary = 'Forgot Password'
        #swagger.tags = ['Auth']
        #swagger.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPassword" }
            }
          }
        }
    */
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email wajib diisi." });
      }

      await authService.forgotPasswordRequest(email);
      success(res, null, FORGOT_PASSWORD_SECURITY_MESSAGE);
    } catch (error: any) {
      error(res, error, "Terjadi kesalahan pada server.");
    }
  },

  async resetPasswordController(req: Request, res: Response) {
    /*
        #swagger.summary = 'Reset Password'
        #swagger.tags = ['Auth']
        #swagger.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPassword" }
            }
          }
        }
    */
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token dan password baru wajib diisi." });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password minimal harus 6 karakter." });
      }

      await authService.resetPassword(token, newPassword);

      res.status(200).json({
        message: "Password berhasil diperbarui. Silakan login kembali.",
      });
    } catch (error: any) {
      res.status(error.status || 400).json({
        message: error.message || "Gagal mereset password.",
        data: null,
      });
    }
  },

  async resetRedirect(req: Request, res: Response) {
    /*
        #swagger.summary = 'Reset Password Redirect'
        #swagger.tags = ['Auth']
    */
    const { token } = req.query;

    const appLink = `femobilepostinventorysystem://resetPassword?token=${token}`;

    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Membuka Toko Intan...</title>
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #059669;">Toko Intan</h2>
        <p>Sedang mengarahkan Anda kembali ke aplikasi...</p>
        <br/>
        <a href="${appLink}" style="display: inline-block; padding: 15px 25px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Buka Aplikasi Manual
        </a>
        <script>
          // Mencoba membuka aplikasi secara otomatis
          window.location.href = "${appLink}";
          
          // Fallback: Jika dalam 2 detik tidak berpindah, beri tahu user
          setTimeout(() => {
          }, 2000);
        </script>
      </body>
    </html>
  `);
  },
};
