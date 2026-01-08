import UserModel from "../models/user.model";
import { ITokenPayload } from "../utils/interfaces";
import { generateAuthTokens, verifyRefreshToken } from "../utils/jwt";
import { verifyPassword } from "../utils/password";
import { TLogin } from "../validators/auth.validate";
import createHttpError from "http-errors";
import { GRACE_PERIOD_SECONDS } from "../utils/constants";

async function loginService(userData: TLogin) {
  const { username, password } = userData;

  const user = await UserModel.findOne({
    username,
  }).select("+password");

  if (!user || !(await verifyPassword(password, user.password))) {
    throw new createHttpError.Unauthorized("Invalid username or password");
  }

  const payload: ITokenPayload = {
    _id: user._id.toString(),
    role: user.role,
  };
  const token = generateAuthTokens(payload);

  user.refreshToken = {
    token: token.refreshToken,
    previousToken: "",
    lastRotatedAt: new Date(),
  };
  await user.save();

  return token;
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

  // SKENARIO 1: Token Valid (Normal Rotation)
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

  // SKENARIO 2: Grace Period (Concurrency)
  if (previousToken === sentToken) {
    const diffInSeconds = (new Date().getTime() - (lastRotatedAt?.getTime() || 0)) / 1000;

    if (diffInSeconds <= GRACE_PERIOD_SECONDS) {
      const { accessToken } = generateAuthTokens(payload);

      return { accessToken, refreshToken: currentToken };
    }
  }

  // SKENARIO 3: Token Reuse Detected
  user.refreshToken = { token: "", previousToken: "", lastRotatedAt: undefined };
  await user.save();

  throw new createHttpError.Unauthorized("Refresh token has been revoked. Please log in again.");
}

export default { loginService, refreshTokenService };
