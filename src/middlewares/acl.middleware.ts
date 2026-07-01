import { NextFunction, Response } from "express";
import { IAuthRequest } from "../utils/interfaces";
import { error } from "../utils/response";

export default (roles: string[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return error(res, null, "Forbidden: You do not have access to this resource", 403);
    }

    next();
  };
};
