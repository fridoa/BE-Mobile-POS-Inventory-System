import { Request } from "express";
import { Types } from "mongoose";
import { ROLES } from "./constants";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  username: string;
  password: string;
  role: ROLES;
  isActive?: boolean;
  fcmToken?: string;
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

export interface IPaginationQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  stockStatus?: "low" | "";
  name?: string;
  sku?: string;
  startDate?: string;
  endDate?: string;
}
