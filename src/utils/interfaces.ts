import { Request } from "express";
import { Types } from "mongoose";
import { ROLES } from "./constants";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  username: string;
  password: string;
  role: ROLES;
  refreshToken?: {
    token: string;
    previousToken?: string;
    lastRotatedAt?: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ITokenPayload {
  _id: string;
  role: ROLES;
}

export interface IAuthRequest extends Request {
  user?: ITokenPayload;
}
