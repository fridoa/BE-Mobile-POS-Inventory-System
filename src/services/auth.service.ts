import UserModel from "../models/user.model";
import { ITokenPayload } from "../utils/interfaces";
import { generateAuthTokens, verifyRefreshToken } from "../utils/jwt";
import { verifyPassword } from "../utils/password";
import { TChangePassword, TLogin } from "../validators/auth.validate";
import createHttpError from "http-errors";
import { GRACE_PERIOD_SECONDS } from "../utils/constants";
import crypto from "crypto";
import { sendForgotPasswordEmail } from "../utils/mail/mail";
import { hashPassword } from "../utils/password";

async function loginService(userData: TLogin, fcmToken?: string) {
  const { username, password } = userData;

  const user = await UserModel.findOne({
    username,
  }).select("+password");

  if (!user || !(await verifyPassword(password, user.password))) {
    throw new createHttpError.Unauthorized("Invalid username or password");
  }

  if (user.isActive === false) {
    throw new createHttpError.Forbidden("Akun Anda telah dinonaktifkan. Silahkan hubungi administrator.");
  }

  const payload: ITokenPayload = {
    _id: user._id.toString(),
    role: user.role,
  };
  const token = generateAuthTokens(payload);

  if (fcmToken) {
    await UserModel.updateMany({ fcmToken: fcmToken }, { $unset: { fcmToken: 1 } });
    user.fcmToken = fcmToken;
  }

  user.refreshToken = {
    token: token.refreshToken,
    previousToken: "",
    lastRotatedAt: new Date(),
  };

  await user.save();

  const userObj = user.toObject();
  const { password: _, fcmToken: __, refreshToken: ___, resetPasswordToken: ____, resetPasswordExpires: _____, __v, ...userWithoutSensitiveData } = userObj;
  return {
    user: userWithoutSensitiveData,
    ...token,
  };
}

async function logoutService(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) return;

  await UserModel.updateOne(
    { _id: userId },
    {
      $unset: { fcmToken: 1 },
      $set: {
        refreshToken: {
          token: "",
          previousToken: "",
          lastRotatedAt: undefined,
        },
      },
    },
  );
}

async function updateProfileService(userId: string, profileData: Partial<{ name: string; email: string; username: string }>) {
  const { name, email, username } = profileData;

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new createHttpError.NotFound("User not found");
  }

  if (username && username !== user.username) {
    const existingUsername = await UserModel.findOne({ username });
    if (existingUsername) throw createHttpError(400, "Username sudah digunakan");
    user.username = username;
  }

  if (email && email !== user.email) {
    if (user.role !== "admin") throw createHttpError(403, "Hanya Admin yang bisa memiliki email");
    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) throw createHttpError(400, "Email sudah digunakan");
    user.email = email;
  }

  if (name) user.name = name;

  return await user.save();
}

async function refreshTokenService(sentToken: string) {
  const userData = verifyRefreshToken(sentToken);

  if (!userData) {
    throw new createHttpError.Unauthorized("Invalid or expired refresh token");
  }

  const user = await UserModel.findById(userData._id).select("+refreshToken");

  if (!user) {
    throw new createHttpError.Unauthorized("User not found");
  }

  const payload: ITokenPayload = {
    _id: user._id.toString(),
    role: user.role,
  };

  const { token: currentToken, previousToken, lastRotatedAt } = user.refreshToken || {};

  if (currentToken === sentToken) {
    const { accessToken, refreshToken: newRefreshToken } = generateAuthTokens(payload);

    user.refreshToken = {
      token: newRefreshToken,
      previousToken: sentToken,
      lastRotatedAt: new Date(),
    };
    await user.save();
    return { accessToken, refreshToken: newRefreshToken };
  }

  if (previousToken === sentToken) {
    const diffInSeconds = (new Date().getTime() - (lastRotatedAt?.getTime() || 0)) / 1000;

    if (diffInSeconds <= GRACE_PERIOD_SECONDS) {
      const { accessToken } = generateAuthTokens(payload);

      return { accessToken, refreshToken: currentToken };
    }
  }

  user.refreshToken = { token: "", previousToken: "", lastRotatedAt: undefined };
  await user.save();

  throw new createHttpError.Unauthorized("Refresh token has been revoked. Please log in again.");
}

async function changePasswordService(userId: string, passwordData: TChangePassword) {
  const { oldPassword, newPassword } = passwordData;

  const user = await UserModel.findById(userId).select("+password");
  if (!user) {
    throw new createHttpError.NotFound("User not found");
  }

  const isOldPasswordValid = await verifyPassword(oldPassword, user.password);
  if (!isOldPasswordValid) {
    throw new createHttpError.Unauthorized("Old password is incorrect");
  }

  user.password = newPassword;
  user.refreshToken = { token: "", previousToken: "", lastRotatedAt: undefined };
  await user.save();
}

async function forgotPasswordRequest(email: string) {
  const user = await UserModel.findOne({ email, role: "admin" });

  if (!user) {
    throw createHttpError(404, "Akun Admin dengan email tersebut tidak ditemukan.");
  }

  if (user.resetPasswordExpires && user.resetPasswordExpires > new Date(Date.now() - 60000)) {
    throw createHttpError(429, "Tunggu 1 menit sebelum request ulang.");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000);

  await user.save();

  await sendForgotPasswordEmail(user.email!, user.username, resetToken);
}

async function resetPassword(token: string, newPassword: string) {
  const user = await UserModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw createHttpError(400, "Token reset password tidak valid atau telah kedaluwarsa.");
  }

  user.password = await hashPassword(newPassword);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
}

export default { changePasswordService, loginService, logoutService, refreshTokenService, forgotPasswordRequest, resetPassword, updateProfileService };
