import { NextFunction, Request, Response } from "express";
import { changePasswordSchema, loginSchema } from "../validators/auth.validate";
import { error, unauthorized } from "../utils/response";
import { IAuthRequest } from "../utils/interfaces";
import { verifyAccessToken } from "../utils/jwt";

const validateLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await loginSchema.validate(req.body, { abortEarly: false });
    next();
  } catch (err) {
    error(res, err, "invalid login data");
  }
};

const authorization = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized(res, "Unauthorized access");
  }

  const token = authHeader.substring(7);

  const userData = verifyAccessToken(token);

  if (!userData) {
    return unauthorized(res, "Invalid or expired token");
  }

  req.user = {
    _id: userData._id,
    role: userData.role,
  };

  next();
};

const validateChangePassword = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    await changePasswordSchema.validate(req.body, { abortEarly: false });
    next();
  } catch (err) {
    error(res, err, "Invalid change password data");
  }
};

export default { validateLogin, authorization, validateChangePassword };
