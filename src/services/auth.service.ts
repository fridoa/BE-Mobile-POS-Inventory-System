import UserModel from "../models/user.model";
import { ITokenPayload } from "../utils/interfaces";
import { generateAuthTokens } from "../utils/jwt";
import { verifyPassword } from "../utils/password";
import { error } from "../utils/response";
import { TLogin } from "../validators/auth.validate";
import createHttpError from "http-errors";

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
  return generateAuthTokens(payload);
}
