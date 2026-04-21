import { Response } from "express";
import * as Yup from "yup";

type Pagination = {
  totalPages: number;
  currentPage: number;
  total: number;
};

interface IMongoError {
  code?: number;
  keyValue?: Record<string, string>;
}

export const success = <T>(res: Response, data: T, message: string) => {
  res.status(200).json({
    meta: { status: 200, message },
    data,
  });
};

export const error = (res: Response, error: unknown, defaultMessage: string, defaultStatus: number = 500) => {
  let status = defaultStatus;
  let message = defaultMessage;
  let errors: Record<string, string> | null = null;

  if (error instanceof Yup.ValidationError) {
    status = 400;
    message = "Validasi gagal.";
    errors = error.inner.reduce((acc: Record<string, string>, err) => {
      if (err.path) {
        acc[err.path] = err.message;
      }
      return acc;
    }, {});
  } else if (typeof error === "object" && error !== null && "code" in error && (error as IMongoError).code === 11000) {
    status = 409;
    const mongoError = error as IMongoError;
    const key = mongoError.keyValue ? Object.keys(mongoError.keyValue)[0] : "Data";
    message = `Data ${key} sudah terdaftar di sistem.`;
  } else if (error instanceof Error) {
    const httpStatus = (error as any)?.statusCode || (error as any)?.status;
    if (typeof httpStatus === "number") {
      status = httpStatus;
    }
    message = error.message;
  }

  res.status(status).json({
    meta: { status, message },
    errors,
  });
};

export const unauthorized = (res: Response, message: string = "Silahkan login terlebih dahulu") => {
  res.status(401).json({
    meta: { status: 401, message },
  });
};

export const forbidden = (res: Response, message: string = "Anda tidak memiliki akses ke fitur ini") => {
  res.status(403).json({
    meta: { status: 403, message },
  });
};

export const pagination = <T>(res: Response, message: string, pagination: Pagination, data: T[]) => {
  res.status(200).json({
    meta: { status: 200, message },
    data,
    pagination,
  });
};
